
import base64
import io
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import defaultdict, deque

# External libraries
import networkx as nx
import matplotlib.pyplot as plt
from automata.fa.nfa import NFA
from automata.fa.dfa import DFA

# ==============================================================================
# 1. PYDANTIC MODELS
# ==============================================================================
class DfaStringInput(BaseModel):
    alphabet: str
    accept_string: str

class NfaRegexInput(BaseModel):
    regex: str

class NfaJsonInput(BaseModel):
    nfa: dict

class GrammarInput(BaseModel):
    grammar: str

# ==============================================================================
# 2. FASTAPI APP & CORS
# ==============================================================================
app = FastAPI(title="Automata & Compiler Lab Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# ==============================================================================
# # 3. GRAPH VISUALIZATION LOGIC
# ==============================================================================
def generate_automaton_graph_base64(automaton, title="Generated Automaton"):
    G = nx.DiGraph()
    G.add_nodes_from(str(s) for s in automaton.states)
    
    edge_labels = defaultdict(list)
    for from_state, transitions in automaton.transitions.items():
        for symbol, to_states in transitions.items():
            normalized_to = to_states if isinstance(to_states, (set, list)) else {to_states}
            for to_state in normalized_to:
                edge_labels[(str(from_state), str(to_state))].append(str(symbol) if symbol else 'ε')

    for (u, v), labels in edge_labels.items():
        G.add_edge(u, v, label=",".join(sorted(list(set(labels)))))

    pos = nx.spring_layout(G, seed=42, k=1.5/((len(G.nodes()))**0.5) if len(G.nodes()) > 1 else 1)
    
    node_colors, color_map = [], {'start': '#a7c7e7', 'final': '#c1e1c1', 'start_final': '#fdfd96', 'normal': '#ffb347'}
    
    for node in G.nodes():
        is_start = node == str(automaton.initial_state)
        is_final = node in {str(s) for s in automaton.final_states}
        if is_start and is_final: node_colors.append(color_map['start_final'])
        elif is_start: node_colors.append(color_map['start'])
        elif is_final: node_colors.append(color_map['final'])
        else: node_colors.append(color_map['normal'])
        
    plt.figure(figsize=(max(8, len(G.nodes())), max(6, len(G.nodes())*0.8)))
    nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=3000, edgecolors='black')
    nx.draw_networkx_labels(G, pos, font_size=10, font_weight='bold')
    nx.draw_networkx_edges(G, pos, edgelist=G.edges(), arrows=True, arrowstyle='->', arrowsize=20, connectionstyle='arc3,rad=0.1')
    nx.draw_networkx_edge_labels(G, pos, edge_labels=nx.get_edge_attributes(G, 'label'), font_color='black', font_size=11)

    plt.title(title, size=16)
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.close()
    buf.seek(0)
    
    return "data:image/png;base64," + base64.b64encode(buf.read()).decode('utf-8')

# ==============================================================================
# 4. HELPER CLASS FOR PARSING ALGORITHMS - CORRECTED
# ==============================================================================
class GrammarProcessor:
    def __init__(self, grammar_str, is_slr=False):
        self.grammar = defaultdict(list)
        self.terminals = set()
        self.non_terminals = set()
        self.start_symbol = None
        self.productions = [] # List of (Head, Body) tuples
        self.is_slr = is_slr
        self._parse(grammar_str)

    def _parse(self, grammar_str):
        lines = [line.strip() for line in grammar_str.strip().split('\n') if "->" in line]
        if not lines: raise ValueError("Grammar is empty or malformed.")
        
        original_start_symbol = lines[0].split('->')[0].strip()
        if self.is_slr:
            self.start_symbol = f"{original_start_symbol}'"
            self.non_terminals.add(self.start_symbol)
            self.productions.append((self.start_symbol, [original_start_symbol]))
            self.grammar[self.start_symbol].append([original_start_symbol])
        else:
            self.start_symbol = original_start_symbol

        for line in lines:
            head, body_str = line.split('->')
            head = head.strip()
            self.non_terminals.add(head)
            for body_segment in body_str.split('|'):
                body = [s for s in body_segment.strip().split(' ') if s]
                processed_body = [] if body == ['epsilon'] else body
                self.productions.append((head, processed_body))
                self.grammar[head].append(processed_body)

        all_symbols = {sym for prods in self.grammar.values() for prod in prods for sym in prod}
        # Assume non-terminals are uppercase or contain '_'
        self.non_terminals.update({s for s in all_symbols if s[0].isupper() or '_' in s})
        self.terminals = all_symbols - self.non_terminals
        if not self.is_slr: self.terminals.add('$')
    
    def compute_first_sets(self):
        first = {nt: set() for nt in self.non_terminals}
        changed = True
        while changed:
            changed = False
            for head, bodies in self.grammar.items():
                for body in bodies:
                    old_len = len(first[head])
                    if not body: # Epsilon production
                        first[head].add('epsilon')
                    else:
                        for symbol in body:
                            if symbol in self.terminals:
                                first[head].add(symbol)
                                break
                            # Add all of FIRST(symbol) except epsilon
                            first[head].update(first[symbol] - {'epsilon'})
                            if 'epsilon' not in first[symbol]:
                                break
                        else: # All symbols in body were nullable
                            first[head].add('epsilon')
                    if len(first[head]) > old_len: changed = True
        return first

    def compute_follow_sets(self, first_sets):
        follow = {nt: set() for nt in self.non_terminals}
        follow[self.start_symbol].add('$')
        changed = True
        while changed:
            changed = False
            for head, body in self.productions:
                for i, symbol in enumerate(body):
                    if symbol in self.non_terminals:
                        old_len = len(follow[symbol])
                        rest = body[i+1:]
                        if rest:
                            first_of_rest = set()
                            for next_sym in rest:
                                sym_first = first_sets.get(next_sym, {next_sym})
                                first_of_rest.update(sym_first - {'epsilon'})
                                if 'epsilon' not in sym_first: break
                            else: # All symbols in rest are nullable
                                first_of_rest.update(follow[head])
                            follow[symbol].update(first_of_rest)
                        else: # Symbol is at the end of the production
                            follow[symbol].update(follow[head])
                        if len(follow[symbol]) > old_len: changed = True
        return follow

# ==============================================================================
# 5. API ENDPOINTS - LL(1) AND SLR(1) ENDPOINTS CORRECTED
# ==============================================================================
@app.post("/api/generate-dfa/")
async def generate_dfa_endpoint(data: DfaStringInput):
    try:
        if data.accept_string and not all(char in data.alphabet for char in data.accept_string):
            raise ValueError("Accept string contains characters not in the defined alphabet.")
        
        states = {f'q{i}' for i in range(len(data.accept_string) + 1)}
        start_state = 'q0'
        final_states = {f'q{len(data.accept_string)}'}
        trap_state = 'q_trap'
        states.add(trap_state)
        
        transitions = {s: {} for s in states}
        
        for i, char in enumerate(data.accept_string):
            transitions[f'q{i}'][char] = f'q{i+1}'
        
        for state in states:
            for symbol in set(data.alphabet):
                if symbol not in transitions[state]:
                    transitions[state][symbol] = trap_state
        
        dfa = DFA(states=states, input_symbols=set(data.alphabet), transitions=transitions, initial_state=start_state, final_states=final_states)
        
        flat_transitions = { f"{s},{sym}": t for s, trans in dfa.transitions.items() for sym, t in trans.items() }
        dfa_data = {
            "states": sorted(list(dfa.states), key=lambda x: (x.startswith('q_'), int(x[1:]) if x[1:].isdigit() else 999)),
            "alphabet": sorted(list(dfa.input_symbols)), "transitions": flat_transitions,
            "start_state": dfa.initial_state, "final_states": sorted(list(dfa.final_states)),
        }
        return {"dfa": dfa_data, "graph_image": generate_automaton_graph_base64(dfa, f"DFA accepting '{data.accept_string}'")}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/generate-nfa/")
async def generate_nfa_endpoint(data: NfaRegexInput):
    try:
        symbols = set(re.findall(r'[a-zA-Z0-9]', data.regex))
        nfa = NFA.from_regex(data.regex, input_symbols=symbols if symbols else None)
        nfa_data = {
            "states": sorted(list(nfa.states)), "alphabet": sorted(list(nfa.input_symbols)),
            "transitions": {str(k): {str(sym): sorted(list(v_set)) for sym, v_set in v.items()} for k, v in nfa.transitions.items()},
            "start_state": nfa.initial_state, "final_states": sorted(list(nfa.final_states)),
        }
        return {"nfa": nfa_data, "graph_image": generate_automaton_graph_base64(nfa, f"NFA for regex '{data.regex}'")}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Regular Expression: {e}")

@app.post("/api/nfa-to-dfa/")
async def nfa_to_dfa_endpoint(data: NfaJsonInput):
    try:
        nfa_def = data.nfa
        formatted_transitions = {s: {k: set(v) for k, v in t.items()} for s, t in nfa_def.get("transitions", {}).items()}
        for state in nfa_def['states']:
            if state not in formatted_transitions: formatted_transitions[state] = {}
            
        nfa = NFA(
            states=set(nfa_def['states']), input_symbols=set(nfa_def['alphabet']),
            transitions=formatted_transitions, initial_state=nfa_def['start_state'],
            final_states=set(nfa_def['final_states'])
        )
        dfa = DFA.from_nfa(nfa)

        def format_state(s): return '{' + ', '.join(sorted(list(s))) + '}' if isinstance(s, frozenset) else str(s)
        
        flat_transitions = {f"{format_state(fs)},{sym}": format_state(ts) for fs, tr in dfa.transitions.items() for sym, ts in tr.items()}
        dfa_data = {
            "states": sorted([format_state(s) for s in dfa.states]), "alphabet": sorted(list(dfa.input_symbols)),
            "transitions": flat_transitions, "start_state": format_state(dfa.initial_state),
            "final_states": sorted([format_state(s) for s in dfa.final_states]),
        }
        return {"dfa": dfa_data, "graph_image": generate_automaton_graph_base64(dfa, "Equivalent DFA")}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/ll1-parser/")
async def ll1_parser_endpoint(data: GrammarInput):
    try:
        processor = GrammarProcessor(data.grammar)
        first_sets = processor.compute_first_sets()
        follow_sets = processor.compute_follow_sets(first_sets)

        table = defaultdict(dict)
        for head, body in processor.productions:
            first_of_body = set()
            for symbol in body:
                sym_first = first_sets.get(symbol, {symbol})
                first_of_body.update(sym_first - {'epsilon'})
                if 'epsilon' not in sym_first: break
            else: first_of_body.add('epsilon')
            
            production_str = ' '.join(body) if body else 'epsilon'
            for terminal in first_of_body - {'epsilon'}:
                if table[head].get(terminal): raise ValueError(f"Conflict at ({head}, {terminal})")
                table[head][terminal] = f"{head} -> {production_str}"
            
            if 'epsilon' in first_of_body:
                for terminal in follow_sets[head]:
                    if table[head].get(terminal): raise ValueError(f"Conflict at ({head}, {terminal})")
                    table[head][terminal] = f"{head} -> {production_str}"
        
        return {
            "first_sets": {k: sorted(list(v)) for k, v in first_sets.items()},
            "follow_sets": {k: sorted(list(v)) for k, v in follow_sets.items()},
            "parse_table": dict(table),
            "terminals": sorted(list(processor.terminals))
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/slr-parser/")
async def slr_parser_endpoint(data: GrammarInput):
    try:
        processor = GrammarProcessor(data.grammar, is_slr=True)
        first_sets = processor.compute_first_sets()
        # The FOLLOW sets needed for reduction are from the *original* start symbol, not the augmented one.
        original_processor = GrammarProcessor(data.grammar)
        _, original_follow_sets = get_ll1_details(original_processor)

        productions_tuple = [(h, tuple(b)) for h, b in processor.productions]

        def closure(items):
            current_items = set(items)
            worklist = list(items)
            while worklist:
                head, body, dot_pos = worklist.pop(0)
                if dot_pos < len(body) and body[dot_pos] in processor.non_terminals:
                    nt_to_expand = body[dot_pos]
                    for p_head, p_body in productions_tuple:
                        if p_head == nt_to_expand:
                            new_item = (p_head, tuple(p_body), 0)
                            if new_item not in current_items:
                                current_items.add(new_item)
                                worklist.append(new_item)
            return frozenset(current_items)

        def goto(item_set, symbol):
            return closure({(h, b, d + 1) for h, b, d in item_set if d < len(b) and b[d] == symbol})

        initial_item = (processor.start_symbol, tuple(processor.grammar[processor.start_symbol][0]), 0)
        states = [closure({initial_item})]
        state_map = {states[0]: 0}
        transitions = {}
        
        queue = deque([states[0]])
        while queue:
            current_items = queue.popleft()
            current_idx = state_map[current_items]
            all_symbols = processor.terminals | processor.non_terminals
            
            for symbol in all_symbols:
                next_items = goto(current_items, symbol)
                if next_items:
                    if next_items not in state_map:
                        state_map[next_items] = len(states)
                        states.append(next_items)
                        queue.append(next_items)
                    transitions[(current_idx, symbol)] = state_map[next_items]

        action_table = defaultdict(dict)
        goto_table = defaultdict(dict)
        
        for i, state_items in enumerate(states):
            for head, body, dot_pos in state_items:
                if dot_pos < len(body): # Shift
                    symbol = body[dot_pos]
                    if symbol in processor.terminals:
                        target = transitions.get((i, symbol))
                        if target is not None:
                            action = f"S{target}"
                            if symbol in action_table[i] and action_table[i][symbol] != action: raise ValueError(f"Shift-Reduce conflict at state {i} on '{symbol}'")
                            action_table[i][symbol] = action
                else: # Reduce or Accept
                    if head == processor.start_symbol: # Accept
                        action_table[i]['$'] = "Accept"
                    else: # Reduce
                        original_prods = [(h, tuple(b)) for h,b in original_processor.productions]
                        prod_num = original_prods.index((head, body))
                        for term in original_follow_sets[head]:
                            action = f"R{prod_num}"
                            if term in action_table[i] and action_table[i][term] != action: raise ValueError(f"Reduce-Reduce/Shift-Reduce conflict at state {i} on '{term}'")
                            action_table[i][term] = action

        for (state, symbol), target in transitions.items():
            if symbol in processor.non_terminals:
                goto_table[state][symbol] = target

        # Merge tables for frontend
        full_table = defaultdict(dict)
        for state, actions in action_table.items():
            full_table[str(state)].update(actions)
        for state, gotos in goto_table.items():
            full_table[str(state)].update(gotos)

        item_sets_formatted = {f"I{i}": [f"{p[0]} -> {' '.join(p[1][:p[2]])} . {' '.join(p[1][p[2]:]) if p[2] < len(p[1]) else ''}" for p in sorted(list(s))] for i, s in enumerate(states)}
        
        return {
            "item_sets": item_sets_formatted,
            "parse_table": dict(full_table),
            "productions": [f"{h} -> {' '.join(b) if b else 'epsilon'}" for h,b in original_processor.productions],
            "terminals": sorted(list(original_processor.terminals)),
            "non_terminals": sorted(list(original_processor.non_terminals))
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))












# import base64
# import io
# import re
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from collections import defaultdict, deque
# import networkx as nx
# import matplotlib.pyplot as plt
# from automata.fa.nfa import NFA
# from automata.fa.dfa import DFA

# # ==============================================================================
# # 1. PYDANTIC MODELS (Input validation) - UNCHANGED
# # ==============================================================================
# class DfaStringInput(BaseModel):
#     alphabet: str
#     accept_string: str

# class NfaRegexInput(BaseModel):
#     regex: str

# class NfaJsonInput(BaseModel):
#     nfa: dict

# class GrammarInput(BaseModel):
#     grammar: str

# # ==============================================================================
# # 2. FASTAPI APP & CORS CONFIGURATION - UNCHANGED
# # ==============================================================================
# app = FastAPI(title="Automata & Compiler Lab Backend")
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"], allow_credentials=True,
#     allow_methods=["*"], allow_headers=["*"],
# )

# # ==============================================================================
# # 3. GRAPH VISUALIZATION LOGIC - UNCHANGED
# # ==============================================================================
# def generate_automaton_graph_base64(automaton, title="Generated Automaton"):
#     G = nx.DiGraph()
#     G.add_nodes_from(str(s) for s in automaton.states)
    
#     edge_labels = defaultdict(list)
#     for from_state, transitions in automaton.transitions.items():
#         for symbol, to_states in transitions.items():
#             normalized_to = to_states if isinstance(to_states, (set, list)) else {to_states}
#             for to_state in normalized_to:
#                 edge_labels[(str(from_state), str(to_state))].append(str(symbol) if symbol else 'ε')

#     for (u, v), labels in edge_labels.items():
#         G.add_edge(u, v, label=",".join(sorted(list(set(labels)))))

#     pos = nx.spring_layout(G, seed=42, k=1.5/((len(G.nodes()))**0.5) if len(G.nodes()) > 1 else 1)
    
#     node_colors, color_map = [], {'start': '#a7c7e7', 'final': '#c1e1c1', 'start_final': '#fdfd96', 'normal': '#ffb347'}
    
#     for node in G.nodes():
#         is_start = node == str(automaton.initial_state)
#         is_final = node in {str(s) for s in automaton.final_states}
#         if is_start and is_final: node_colors.append(color_map['start_final'])
#         elif is_start: node_colors.append(color_map['start'])
#         elif is_final: node_colors.append(color_map['final'])
#         else: node_colors.append(color_map['normal'])
        
#     plt.figure(figsize=(max(8, len(G.nodes())), max(6, len(G.nodes())*0.8)))
#     nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=3000, edgecolors='black')
#     nx.draw_networkx_labels(G, pos, font_size=10, font_weight='bold')
#     nx.draw_networkx_edges(G, pos, edgelist=G.edges(), arrows=True, arrowstyle='->', arrowsize=20, connectionstyle='arc3,rad=0.1')
#     nx.draw_networkx_edge_labels(G, pos, edge_labels=nx.get_edge_attributes(G, 'label'), font_color='black', font_size=11)

#     plt.title(title, size=16)
    
#     buf = io.BytesIO()
#     plt.savefig(buf, format='png', bbox_inches='tight')
#     plt.close()
#     buf.seek(0)
    
#     return "data:image/png;base64," + base64.b64encode(buf.read()).decode('utf-8')

# # ==============================================================================
# # 4. HELPER CLASS FOR PARSING ALGORITHMS - CORRECTED
# # ==============================================================================
# class GrammarProcessor:
#     def __init__(self, grammar_str, is_slr=False):
#         self.grammar = defaultdict(list)
#         self.terminals = set()
#         self.non_terminals = set()
#         self.start_symbol = None
#         self.productions = [] # List of (Head, Body) tuples
#         self.is_slr = is_slr
#         self._parse(grammar_str)

#     def _parse(self, grammar_str):
#         lines = [line.strip() for line in grammar_str.strip().split('\n') if "->" in line]
#         if not lines: raise ValueError("Grammar is empty or malformed.")
        
#         # Augment grammar for SLR
#         original_start_symbol = lines[0].split('->')[0].strip()
#         if self.is_slr:
#             self.start_symbol = f"{original_start_symbol}'"
#             self.non_terminals.add(self.start_symbol)
#             self.productions.append((self.start_symbol, [original_start_symbol]))
#             self.grammar[self.start_symbol].append([original_start_symbol])
#         else:
#             self.start_symbol = original_start_symbol

#         for line in lines:
#             head, body_str = line.split('->')
#             head = head.strip()
#             self.non_terminals.add(head)
#             for body_segment in body_str.split('|'):
#                 body = [s for s in body_segment.strip().split(' ') if s]
#                 processed_body = [] if body == ['epsilon'] else body
#                 self.productions.append((head, processed_body))
#                 self.grammar[head].append(processed_body)

#         all_symbols = {sym for prods in self.grammar.values() for prod in prods for sym in prod}
#         # Assume non-terminals are uppercase or contain '_'
#         self.non_terminals.update({s for s in all_symbols if s[0].isupper() or '_' in s})
#         self.terminals = all_symbols - self.non_terminals
#         if not self.is_slr: self.terminals.add('$')
    
#     def compute_first_sets(self):
#         first = {nt: set() for nt in self.non_terminals}
#         changed = True
#         while changed:
#             changed = False
#             for head, bodies in self.grammar.items():
#                 for body in bodies:
#                     old_len = len(first[head])
#                     if not body:
#                         first[head].add('epsilon')
#                     else:
#                         for symbol in body:
#                             if symbol in self.terminals:
#                                 first[head].add(symbol)
#                                 break
#                             first[head].update(first[symbol] - {'epsilon'})
#                             if 'epsilon' not in first[symbol]:
#                                 break
#                         else: # All symbols in body were nullable
#                             first[head].add('epsilon')
#                     if len(first[head]) > old_len: changed = True
#         return first

#     def compute_follow_sets(self, first_sets):
#         follow = {nt: set() for nt in self.non_terminals}
#         follow[self.start_symbol].add('$')
#         changed = True
#         while changed:
#             changed = False
#             for head, body in self.productions:
#                 for i, symbol in enumerate(body):
#                     if symbol in self.non_terminals:
#                         old_len = len(follow[symbol])
#                         rest = body[i+1:]
#                         if rest:
#                             first_of_rest = set()
#                             for next_sym in rest:
#                                 sym_first = first_sets.get(next_sym, {next_sym})
#                                 first_of_rest.update(sym_first - {'epsilon'})
#                                 if 'epsilon' not in sym_first: break
#                             else: first_of_rest.update(follow[head])
#                             follow[symbol].update(first_of_rest)
#                         else:
#                             follow[symbol].update(follow[head])
#                         if len(follow[symbol]) > old_len: changed = True
#         return follow

# # ==============================================================================
# # 5. API ENDPOINTS - LL(1) AND SLR(1) ENDPOINTS CORRECTED
# # ==============================================================================
# @app.post("/api/generate-dfa/")
# async def generate_dfa_endpoint(data: DfaStringInput):
#     try:
#         if data.accept_string and not all(char in data.alphabet for char in data.accept_string):
#             raise ValueError("Accept string contains characters not in the defined alphabet.")
        
#         states = {f'q{i}' for i in range(len(data.accept_string) + 1)}
#         start_state = 'q0'
#         final_states = {f'q{len(data.accept_string)}'}
#         trap_state = 'q_trap'
#         states.add(trap_state)
        
#         transitions = {s: {} for s in states}
        
#         for i, char in enumerate(data.accept_string):
#             transitions[f'q{i}'][char] = f'q{i+1}'
        
#         for state in states:
#             for symbol in set(data.alphabet):
#                 if symbol not in transitions[state]:
#                     transitions[state][symbol] = trap_state
        
#         dfa = DFA(states=states, input_symbols=set(data.alphabet), transitions=transitions, initial_state=start_state, final_states=final_states)
        
#         flat_transitions = { f"{s},{sym}": t for s, trans in dfa.transitions.items() for sym, t in trans.items() }
#         dfa_data = {
#             "states": sorted(list(dfa.states), key=lambda x: (x.startswith('q_'), int(x[1:]) if x[1:].isdigit() else 999)),
#             "alphabet": sorted(list(dfa.input_symbols)), "transitions": flat_transitions,
#             "start_state": dfa.initial_state, "final_states": sorted(list(dfa.final_states)),
#         }
#         return {"dfa": dfa_data, "graph_image": generate_automaton_graph_base64(dfa, f"DFA accepting '{data.accept_string}'")}
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))

# @app.post("/api/generate-nfa/")
# async def generate_nfa_endpoint(data: NfaRegexInput):
#     try:
#         symbols = set(re.findall(r'[a-zA-Z0-9]', data.regex))
#         nfa = NFA.from_regex(data.regex, input_symbols=symbols if symbols else None)
#         nfa_data = {
#             "states": sorted(list(nfa.states)), "alphabet": sorted(list(nfa.input_symbols)),
#             "transitions": {str(k): {str(sym): sorted(list(v_set)) for sym, v_set in v.items()} for k, v in nfa.transitions.items()},
#             "start_state": nfa.initial_state, "final_states": sorted(list(nfa.final_states)),
#         }
#         return {"nfa": nfa_data, "graph_image": generate_automaton_graph_base64(nfa, f"NFA for regex '{data.regex}'")}
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=f"Invalid Regular Expression: {e}")

# @app.post("/api/nfa-to-dfa/")
# async def nfa_to_dfa_endpoint(data: NfaJsonInput):
#     try:
#         nfa_def = data.nfa
#         formatted_transitions = {s: {k: set(v) for k, v in t.items()} for s, t in nfa_def.get("transitions", {}).items()}
#         for state in nfa_def['states']:
#             if state not in formatted_transitions: formatted_transitions[state] = {}
            
#         nfa = NFA(
#             states=set(nfa_def['states']), input_symbols=set(nfa_def['alphabet']),
#             transitions=formatted_transitions, initial_state=nfa_def['start_state'],
#             final_states=set(nfa_def['final_states'])
#         )
#         dfa = DFA.from_nfa(nfa)

#         def format_state(s): return '{' + ', '.join(sorted(list(s))) + '}' if isinstance(s, frozenset) else str(s)
        
#         flat_transitions = {f"{format_state(fs)},{sym}": format_state(ts) for fs, tr in dfa.transitions.items() for sym, ts in tr.items()}
#         dfa_data = {
#             "states": sorted([format_state(s) for s in dfa.states]), "alphabet": sorted(list(dfa.input_symbols)),
#             "transitions": flat_transitions, "start_state": format_state(dfa.initial_state),
#             "final_states": sorted([format_state(s) for s in dfa.final_states]),
#         }
#         return {"dfa": dfa_data, "graph_image": generate_automaton_graph_base64(dfa, "Equivalent DFA")}
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))


# @app.post("/api/ll1-parser/")
# async def ll1_parser_endpoint(data: GrammarInput):
#     try:
#         processor = GrammarProcessor(data.grammar)
#         first_sets = processor.compute_first_sets()
#         follow_sets = processor.compute_follow_sets(first_sets)

#         table = defaultdict(dict)
#         for head, body in processor.productions:
#             first_of_body = set()
#             for symbol in body:
#                 sym_first = first_sets.get(symbol, {symbol})
#                 first_of_body.update(sym_first - {'epsilon'})
#                 if 'epsilon' not in sym_first: break
#             else: first_of_body.add('epsilon')
            
#             production_str = ' '.join(body) if body else 'epsilon'
#             for terminal in first_of_body - {'epsilon'}:
#                 if table[head].get(terminal): raise ValueError(f"Conflict at ({head}, {terminal})")
#                 table[head][terminal] = f"{head} -> {production_str}"
            
#             if 'epsilon' in first_of_body:
#                 for terminal in follow_sets[head]:
#                     if table[head].get(terminal): raise ValueError(f"Conflict at ({head}, {terminal})")
#                     table[head][terminal] = f"{head} -> {production_str}"
        
#         # --- DEFINITIVE FIX FOR FRONTEND ---
#         # Directly provide the list of terminals the frontend needs.
#         return {
#             "first_sets": {k: sorted(list(v)) for k, v in first_sets.items()},
#             "follow_sets": {k: sorted(list(v)) for k, v in follow_sets.items()},
#             "parse_table": dict(table),
#             "terminals": sorted(list(processor.terminals))
#         }
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))

# @app.post("/api/slr-parser/")
# async def slr_parser_endpoint(data: GrammarInput):
#     try:
#         processor = GrammarProcessor(data.grammar, is_slr=True)
#         first_sets = processor.compute_first_sets()
#         follow_sets = processor.compute_follow_sets(first_sets)

#         productions_tuple = [(h, tuple(b)) for h, b in processor.productions]

#         def closure(items):
#             current_items = set(items)
#             worklist = list(items)
#             while worklist:
#                 head, body, dot_pos = worklist.pop(0)
#                 if dot_pos < len(body) and body[dot_pos] in processor.non_terminals:
#                     nt_to_expand = body[dot_pos]
#                     for p_head, p_body in productions_tuple:
#                         if p_head == nt_to_expand:
#                             new_item = (p_head, p_body, 0)
#                             if new_item not in current_items:
#                                 current_items.add(new_item)
#                                 worklist.append(new_item)
#             return frozenset(current_items)

#         def goto(item_set, symbol):
#             return closure({(h, b, d + 1) for h, b, d in item_set if d < len(b) and b[d] == symbol})

#         initial_item = (processor.start_symbol, tuple(processor.grammar[processor.start_symbol][0]), 0)
#         states = [closure({initial_item})]
#         state_map = {states[0]: 0}
#         transitions = {}
        
#         queue = deque([states[0]])
#         while queue:
#             current_items = queue.popleft()
#             current_idx = state_map[current_items]
#             for symbol in processor.terminals | processor.non_terminals:
#                 next_items = goto(current_items, symbol)
#                 if next_items:
#                     if next_items not in state_map:
#                         state_map[next_items] = len(states)
#                         states.append(next_items)
#                         queue.append(next_items)
#                     transitions[(current_idx, symbol)] = state_map[next_items]

#         action_table = defaultdict(dict)
#         goto_table = defaultdict(dict)
        
#         for i, state_items in enumerate(states):
#             for head, body, dot_pos in state_items:
#                 if dot_pos < len(body): # Shift
#                     symbol = body[dot_pos]
#                     if symbol in processor.terminals:
#                         target = transitions.get((i, symbol))
#                         if target is not None:
#                             if symbol in action_table[i] and action_table[i][symbol] != f"S{target}": raise ValueError(f"Shift-Reduce conflict at state {i} on '{symbol}'")
#                             action_table[i][symbol] = f"S{target}"
#                 else: # Reduce or Accept
#                     if head == processor.start_symbol: # Accept
#                         action_table[i]['$'] = "Accept"
#                     else: # Reduce
#                         prod_num = productions_tuple.index((head, body))
#                         for term in follow_sets[head]:
#                             if term in action_table[i]: raise ValueError(f"Reduce-Reduce/Shift-Reduce conflict at state {i} on '{term}'")
#                             action_table[i][term] = f"R{prod_num}"

#         for (state, symbol), target in transitions.items():
#             if symbol in processor.non_terminals:
#                 goto_table[state][symbol] = target

#         item_sets_formatted = {f"I{i}": [f"{p[0]} -> {' '.join(p[1][:p[2]])} . {' '.join(p[1][p[2]:])}" for p in sorted(list(s))] for i, s in enumerate(states)}
        
#         # --- DEFINITIVE FIX FOR FRONTEND ---
#         # Directly provide all lists the frontend needs to render tables.
#         return {
#             "item_sets": item_sets_formatted,
#             "parse_table": { str(k): v for k, v in (action_table | goto_table).items() },
#             "productions": [f"{h} -> {' '.join(b) if b else 'epsilon'}" for h,b in processor.productions],
#             "terminals": sorted(list(processor.terminals)),
#             "non_terminals": sorted(list(processor.non_terminals - {processor.start_symbol}))
#         }
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))













