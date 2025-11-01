import React, { useState, useEffect } from "react";
import "./App.css";

/* -------------------- Topic Data (ENRICHED WITH FORMAL DEFINITIONS) -------------------- */
const TOPICS = {
    "dfa-generator": {
        title: "DFA: Deterministic Finite Automaton",
        overview: `A Deterministic Finite Automaton (DFA) is formally defined as a 5-tuple: $$ (Q, \\Sigma, \\delta, q_0, F) $$
        <ul>
            <li><b>Q:</b> A finite set of states</li>
            <li><b>Σ (Sigma):</b> A finite set of input symbols (the alphabet)</li>
            <li><b>δ (delta):</b> The transition function, where $ \\delta: Q \\times \\Sigma \\rightarrow Q $</li>
            <li><b>q₀:</b> The initial (start) state, where $ q_0 \\in Q $</li>
            <li><b>F:</b> A set of accepting (final) states, where $ F \\subseteq Q $</li>
        </ul>
        <b>Key property:</b> For each state and input symbol, there is exactly one transition. No ε (epsilon) transitions are allowed.`,
        steps: [
            "Start at the initial state $q_0$.",
            "Read the input string one symbol at a time from left to right.",
            "For each symbol, use the transition function $ \\delta $ to move from the current state to the next state.",
            "After the last symbol has been processed, check the current state.",
            "If the current state is in the set of final states F, the string is <b>accepted</b>.",
            "Otherwise, the string is <b>rejected</b>."
        ],
        example: {
            problem: `Design a DFA that accepts all binary strings ending with "01".`,
            solutionSteps: [
                "$Q = \\{q_0, q_1, q_2\\}$",
                "$\\Sigma = \\{0, 1\\}$",
                "$q_0$ is the start state.",
                "$F = \\{q_2\\}$ (the only final state).",
                `The transition function $ \\delta $ is defined as:
                <table class="table table-sm table-bordered mt-2 text-center">
                    <thead><tr><th>State</th><th>Input '0'</th><th>Input '1'</th></tr></thead>
                    <tbody>
                        <tr><td>➡️q₀</td><td>q₁</td><td>q₀</td></tr>
                        <tr><td>q₁</td><td>q₁</td><td>q₂</td></tr>
                        <tr><td>*q₂</td><td>q₁</td><td>q₀</td></tr>
                    </tbody>
                </table>`,
                "<b>Explanation:</b> The automaton remembers if it has just seen a '0' (state q₁). If it then sees a '1', it moves to the final state q₂. Any other input resets the pattern."
            ],
            final: `<b>Test String "10101":</b>
            <br>1. Start at $q_0$. Read '1'. $ \\delta(q_0, 1) = q_0 $.
            <br>2. Current state $q_0$. Read '0'. $ \\delta(q_0, 0) = q_1 $.
            <br>3. Current state $q_1$. Read '1'. $ \\delta(q_1, 1) = q_2 $.
            <br>4. Current state $q_2$. Read '0'. $ \\delta(q_2, 0) = q_1 $.
            <br>5. Current state $q_1$. Read '1'. $ \\delta(q_1, 1) = q_2 $.
            <br>End of string. Current state is $q_2$, which is in F. String is ✅ <b>Accepted</b>.`,
        },
    },
    "nfa-generator": {
        title: "NFA: Non-deterministic Finite Automaton",
        overview: `A Non-deterministic Finite Automaton (NFA) is also a 5-tuple, but with a key difference in its transition function: $$ (Q, \\Sigma, \\delta, q_0, F) $$
        The transition function $ \\delta $ maps to the power set of Q:
        $$ \\delta: Q \\times (\\Sigma \\cup \\{\\epsilon\\}) \\rightarrow 2^Q $$
        <b>Key properties:</b>
        <ul>
            <li>Can have multiple possible transitions from a state on a single symbol.</li>
            <li>Can have ε (epsilon) transitions, allowing state changes without consuming input.</li>
            <li>Accepts a string if at least <b>one</b> possible path ends in a final state.</li>
        </ul>This tool builds an NFA from a regular expression using <b>Thompson's Construction</b>.`,
        steps: [
            "<b>Base Cases:</b> For ε, create two states with an ε-transition. For a symbol 'a', create two states with an 'a' transition.",
            "<b>Concatenation (ab):</b> The final state of the NFA for 'a' is merged with the initial state of the NFA for 'b'.",
            "<b>Union (a|b):</b> Create a new start state with ε-transitions to the start states of the NFAs for 'a' and 'b'. Create a new final state, and add ε-transitions from the old final states to this new one.",
            "<b>Kleene Star (a*):</b> Create new start and final states. Add ε-transitions to create a loop around the NFA for 'a', and also to bypass it entirely."
        ],
        example: {
            problem: "Construct an NFA for the regular expression `(a|b)*a`.",
            solutionSteps: [
                "1. Build simple NFAs for 'a' and 'b'.",
                "2. Combine them using the <b>Union</b> rule to create an NFA for `(a|b)`.",
                "3. Apply the <b>Kleene Star</b> rule to the `(a|b)` NFA to allow zero or more repetitions.",
                "4. Build another simple NFA for the final 'a'.",
                "5. Connect the NFA for `(a|b)*` to the final 'a' NFA using the <b>Concatenation</b> rule."
            ],
            final: "The resulting NFA non-deterministically loops on 'a' or 'b', then deterministically transitions on a final 'a' to reach the accepting state.",
        },
    },
    "nfa-to-dfa": {
        title: "NFA → DFA: Subset Construction",
        overview: "For every NFA, there exists an equivalent DFA. The <b>Subset Construction</b> algorithm systematically converts an NFA to a DFA. Each state in the resulting DFA corresponds to a *set of states* from the NFA.",
        steps: [
            "<b>1. ε-closure:</b> First, define a function `ε-closure(S)` that returns the set of all NFA states reachable from any state in set S using only ε-transitions.",
            "<b>2. Initialize:</b> The start state of the DFA is `ε-closure({q₀})`, where `q₀` is the NFA's start state.",
            "<b>3. Iterate:</b> Create a worklist containing the new DFA start state. While the worklist is not empty:",
            "  a) Dequeue a DFA state `S`.",
            "  b) For each symbol `a` in the alphabet, compute `move(S, a)`: the set of NFA states reachable from `S` on input `a`.",
            "  c) The new DFA state is `T = ε-closure(move(S, a))`. Add the transition `δ(S, a) = T`.",
            "  d) If `T` is a new state, add it to the worklist.",
            "<b>4. Final States:</b> Any DFA state that contains at least one of the NFA's original final states is marked as a final state in the DFA."
        ],
        example: {
            problem: "Convert an NFA with states ${q_0, q_1}$, start $q_0$, final ${q_1}$. Transitions: $ \\delta(q_0, a) = \\{q_0, q_1\\} $, $ \\delta(q_0, b) = \\{q_1\\} $.",
            solutionSteps: [
                "DFA Start State (A): `ε-closure({q₀})` = `{q₀}`. So, A = `{q₀}`.",
                "From A on 'a': `move(A, a)` = `{q₀, q₁}`. `ε-closure({q₀, q₁})` = `{q₀, q₁}`. Let's call this new state B.",
                "From A on 'b': `move(A, b)` = `{q₁}`. `ε-closure({q₁})` = `{q₁}`. Let's call this new state C.",
                "From B (`{q₀, q₁}`) on 'a': `move(B, a)` = `δ(q₀,a) ∪ δ(q₁,a)` = `{q₀, q₁}`. So, B goes to B on 'a'.",
                "From B (`{q₀, q₁}`) on 'b': `move(B, b)` = `δ(q₀,b) ∪ δ(q₁,b)` = `{q₁}`. So, B goes to C on 'b'.",
                "From C (`{q₁}`) on 'a' or 'b': There are no outgoing transitions, so it goes to an empty (trap) state.",
                "Final States: B and C both contain the original NFA final state `q₁`, so they are final states in the DFA."
            ],
            final: "The resulting DFA has states A=`{q₀}`, B=`{q₀,q₁}`, C=`{q₁}`, where B and C are final states.",
        },
    },
    "ll1-parser": {
        title: "LL(1) Parser Generator",
        overview: "An LL(1) parser is a top-down parser that constructs a leftmost derivation. It's called LL(1) because it processes input from <b>L</b>eft to right, produces a <b>L</b>eftmost derivation, and uses <b>1</b> lookahead symbol. It relies on a pre-computed parsing table to make deterministic decisions. For a grammar to be LL(1), it must not be ambiguous or left-recursive.",
        steps: [
            "<b>Compute FIRST sets:</b> For each grammar symbol X, `FIRST(X)` is the set of terminals that can begin a string derived from X. If X can derive ε, then ε is in `FIRST(X)`.",
            "<b>Compute FOLLOW sets:</b> For each non-terminal A, `FOLLOW(A)` is the set of terminals that can appear immediately to the right of A. The end-of-input marker '$' is in the `FOLLOW` set of the start symbol.",
            "<b>Construct the Parse Table M:</b> For each production A → α:",
            "  a) For each terminal `t` in `FIRST(α)`, add A → α to `M[A, t]`.",
            "  b) If ε is in `FIRST(α)`, then for each terminal `t` in `FOLLOW(A)`, add A → α to `M[A, t]`.",
            "<b>Check for Conflicts:</b> If any cell in the table `M` contains more than one production, the grammar is not LL(1)."
        ],
        example: {
            problem: "For the classic expression grammar:<br>$E \\rightarrow T E'$<br>$E' \\rightarrow + T E' | \\epsilon$<br>$T \\rightarrow F T'$<br>$T' \\rightarrow * F T' | \\epsilon$<br>$F \\rightarrow ( E ) | id$",
            solutionSteps: [
                "FIRST(E) = FIRST(T) = FIRST(F) = { '(', 'id' }",
                "FOLLOW(E) = { '$', ')' }",
                "FOLLOW(E') = FOLLOW(E) = { '$', ')' }",
                "Table Entry `M[E', +]`: The production is $E' \\rightarrow + T E'$. `FIRST(+ T E')` is `{ '+' }`. So, add the production to `M[E', +]`.",
                "Table Entry `M[E', )]`: The production is $E' \\rightarrow \\epsilon$. `FIRST(ε)` is `{ ε }`. We must look at `FOLLOW(E')`, which is `{ '$', ')' }`. So, add $E' \\rightarrow \\epsilon$ to `M[E', )]` and `M[E', $]`."
            ],
            final: "The completed table guides the parser. When considering non-terminal E' and seeing input '+', it applies $E' \\rightarrow + T E'$. If it sees ')' or '$', it applies $E' \\rightarrow \\epsilon$.",
        },
    },
    "lr-parser": {
        title: "SLR(1) Parser Generator",
        overview: "An SLR(1) parser is a bottom-up parser that is more powerful than an LL(1) parser. It reads input from <b>L</b>eft to right, producing a <b>R</b>ightmost derivation in reverse, using <b>1</b> lookahead symbol. It works by shifting tokens onto a stack and reducing them when the top of the stack matches the right-hand side of a grammar rule (a handle).",
        steps: [
            "<b>Augment the Grammar:</b> Add a new start production $S' \\rightarrow S$, where S is the original start symbol.",
            "<b>Create LR(0) Items:</b> An LR(0) item is a production with a dot '.' on the right-hand side, indicating how much of the production has been seen (e.g., $A \\rightarrow x . y$).",
            "<b>Compute `closure()` and `goto()`:</b> The `closure` operation finds all items implied by a set of items. The `goto` function defines the transitions between sets of items (states).",
            "<b>Build Canonical Collection of Items:</b> These sets of items are the states of the parser's underlying automaton.",
            "<b>Construct ACTION/GOTO Table:</b>",
            "  a) <b>Shift:</b> If state `I` contains item $[A \\rightarrow \\alpha . a \\beta]$ and `goto(I, a) = J`, set `ACTION[I, a] = shift J`.",
            "  b) <b>Reduce:</b> If state `I` contains a final item $[A \\rightarrow \\alpha .]$, then for every terminal `t` in `FOLLOW(A)`, set `ACTION[I, t] = reduce A \\rightarrow \\alpha`.",
            "  c) <b>Accept:</b> If state `I` contains $[S' \\rightarrow S .]$, set `ACTION[I, $] = accept`."
        ],
        example: {
            problem: "For the grammar $S \\rightarrow a S b | c$",
            solutionSteps: [
                "1. Augment: $S' \\rightarrow S$",
                "2. Initial State (I₀): `closure({[S' -> .S]})` gives the set { $[S' \\rightarrow .S]$, $[S \\rightarrow .a S b]$, $[S \\rightarrow .c]$ }.",
                "3. Compute Transitions: `goto(I₀, a)` creates a new state containing $[S \\rightarrow a .S b]$ and its closure. `goto(I₀, c)` creates a state with $[S \\rightarrow c .]$.",
                "4. Build Table: In state I₀, on input 'a', the table action is 'Shift'. On 'c', it is also 'Shift'.",
                "5. Reduce Action: In the state containing $[S \\rightarrow c .]$, for any terminal `t` in `FOLLOW(S)` (which includes 'b' and '$'), the table action is 'Reduce using $S \\rightarrow c$`."
            ],
            final: "The SLR table uses FOLLOW sets to decide when to reduce. A shift-reduce conflict occurs if a state contains both a shift and a reduce action for the same terminal. A reduce-reduce conflict occurs if there are two possible reduce actions.",
        },
    },
};

/* -------------------- Main App Component -------------------- */
function App() {
    useEffect(() => {
        if (window.MathJax) {
            window.MathJax.typesetPromise();
        }
    });

    const [activeTool, setActiveTool] = useState("welcome");

    const renderContent = () => {
        switch (activeTool) {
            case "dfa-generator": return <DfaGeneratorTool />;
            case "nfa-generator": return <NfaGeneratorTool />;
            case "nfa-to-dfa": return <NfaToDfaTool />;
            case "ll1-parser": return <Ll1ParserTool />;
            case "lr-parser": return <LrParserTool />;
            default: return <WelcomeContent />;
        }
    };

    return (
        <>
            <Header />
            <div className="container-fluid">
                <div className="row">
                    <Sidebar setActiveTool={setActiveTool} />
                    <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main-content">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </>
    );
}

/* -------------------- Reusable UI Components -------------------- */
const Header = () => (
    <header className="navbar navbar-dark sticky-top shadow-sm custom-navbar">
        <a className="navbar-brand col-md-3 col-lg-2 me-0 px-3" href="#">
            <i className="bi bi-braces-asterisk me-2"></i>
            <span style={{ fontWeight: 300 }}>Automata</span>
            <span style={{ fontWeight: 600 }}>&nbsp;Lab</span>
        </a>
    </header>
);

const Sidebar = ({ setActiveTool }) => {
    const [active, setActive] = useState("welcome");
    const handleClick = (tool) => { setActive(tool); setActiveTool(tool); };

    return (
        <nav id="sidebarMenu" className="col-md-3 col-lg-2 d-md-block sidebar collapse">
            <div className="position-sticky pt-3 sidebar-sticky">
                <ul className="nav flex-column">
                    <li className="nav-item">
                        <a href="#" className={`nav-link ${active === "welcome" ? "active" : ""}`} onClick={() => handleClick("welcome")}>
                            <i className="bi bi-house-door-fill me-2"></i> Home
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#fa-submenu">
                            <i className="bi bi-gear-wide-connected me-2"></i> Finite Automata
                        </a>
                        <div className="collapse show" id="fa-submenu">
                            <ul className="nav flex-column ms-3">
                                <li className="nav-item"><a href="#" className={`nav-link ${active === "dfa-generator" ? "active" : ""}`} onClick={() => handleClick("dfa-generator")}>DFA Generator</a></li>
                                <li className="nav-item"><a href="#" className={`nav-link ${active === "nfa-generator" ? "active" : ""}`} onClick={() => handleClick("nfa-generator")}>NFA Generator</a></li>
                                <li className="nav-item"><a href="#" className={`nav-link ${active === "nfa-to-dfa" ? "active" : ""}`} onClick={() => handleClick("nfa-to-dfa")}>NFA to DFA</a></li>
                            </ul>
                        </div>
                    </li>
                    <li className="nav-item">
                         <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#parser-submenu">
                            <i className="bi bi-file-earmark-code me-2"></i> Parsers
                        </a>
                        <div className="collapse show" id="parser-submenu">
                             <ul className="nav flex-column ms-3">
                                <li className="nav-item"><a href="#" className={`nav-link ${active === "ll1-parser" ? "active" : ""}`} onClick={() => handleClick("ll1-parser")}>LL(1) Parser</a></li>
                                <li className="nav-item"><a href="#" className={`nav-link ${active === "lr-parser" ? "active" : ""}`} onClick={() => handleClick("lr-parser")}>SLR(1) Parser</a></li>
                             </ul>
                        </div>
                    </li>
                </ul>
            </div>
        </nav>
    );
};


const WelcomeContent = () => (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
        <div className="welcome-card text-center shadow-sm">
            <h1 className="display-5 mb-3">Welcome to the Lab</h1>
            <p className="lead text-muted">Select a tool from the sidebar to begin exploring automata and compiler design concepts.</p>
            <i className="bi bi-box-arrow-in-left display-1 mt-3 text-primary"></i>
        </div>
    </div>
);

const TopicInfoPanel = ({ topicKey }) => {
    const topic = TOPICS[topicKey];
    useEffect(() => { if (window.MathJax) { window.MathJax.typesetPromise(); } }, [topicKey]);

    return (
        <div className="card info-card mb-4">
            <div className="card-body">
                <h5 className="card-title"><i className="bi bi-info-circle me-2"></i>How it Works</h5>
                <p className="card-text" dangerouslySetInnerHTML={{ __html: topic.overview }} />
                <div className="accordion mt-4" id={`accordion-${topicKey}`}>
                    <div className="accordion-item">
                        <h2 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-steps-${topicKey}`}>Step-by-step Process</button></h2>
                        <div id={`collapse-steps-${topicKey}`} className="accordion-collapse collapse" data-bs-parent={`#accordion-${topicKey}`}>
                            <div className="accordion-body topic-steps">
                                <ol>{topic.steps.map((s, i) => <li key={i} dangerouslySetInnerHTML={{ __html: s }} />)}</ol>
                            </div>
                        </div>
                    </div>
                    <div className="accordion-item">
                        <h2 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-example-${topicKey}`}>Worked Example</button></h2>
                        <div id={`collapse-example-${topicKey}`} className="accordion-collapse collapse" data-bs-parent={`#accordion-${topicKey}`}>
                            <div className="accordion-body solution-card">
                                <h6 className="fw-semibold">Problem</h6>
                                <p className="mb-3" dangerouslySetInnerHTML={{ __html: topic.example.problem }} />
                                <h6 className="fw-semibold">Solution — steps</h6>
                                <ol>{topic.example.solutionSteps.map((ss, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: ss }} />)}</ol>
                                <div className="mt-3">
                                    <h6 className="fw-semibold">Final / Result</h6>
                                    <div dangerouslySetInnerHTML={{ __html: topic.example.final }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DfaResultsDisplay = ({ results }) => (
    <div className="card results-card">
        <div className="card-header fw-bold">Results: Transition Table</div>
        <div className="card-body">
            <div className="table-responsive mb-3">
                <table className="table table-bordered text-center">
                    <thead><tr><th>State</th>{results.dfa.alphabet.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                        {results.dfa.states.map((state) => (
                            <tr key={state}>
                                <td className="fw-medium">
                                    {state === results.dfa.start_state && "➡️ "}
                                    {results.dfa.final_states.includes(state) && "*"}
                                    {state}
                                </td>
                                {results.dfa.alphabet.map((symbol) => (<td key={symbol}>{results.dfa.transitions[`${state},${symbol}`] || "—"}</td>))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="text-center"><img src={results.graph_image} alt="DFA Graph" className="img-fluid rounded border" /></div>
        </div>
    </div>
);

/* -------------------- Tool Implementations -------------------- */
const ToolWrapper = ({ topicKey, children }) => (
    <>
        <div className="section-header"><h1 className="h2">{TOPICS[topicKey].title}</h1></div>
        <div className="row g-4 justify-content-center">
            <div className="col-lg-12"><TopicInfoPanel topicKey={topicKey} /></div>
            <div className="col-lg-10 col-md-12">{children}</div>
        </div>
    </>
);

const handleApiSubmit = async (endpoint, body, setResults, setError, setIsLoading) => {
    setResults(null); setError(""); setIsLoading(true);
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/${endpoint}/`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || `HTTP error! Status: ${response.status}`);
        }
        if (data.error) {
            throw new Error(data.error);
        }
        setResults(data);
    } catch (err) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
};

const DfaGeneratorTool = () => {
    const [alphabet, setAlphabet] = useState("ab");
    const [acceptString, setAcceptString] = useState("aba");
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (acceptString && ![...acceptString].every((char) => alphabet.includes(char))) {
            setError(`Error: The string '${acceptString}' contains characters not in the alphabet '${alphabet}'.`);
            return;
        }
        handleApiSubmit("generate-dfa", { alphabet, accept_string: acceptString }, setResults, setError, setIsLoading);
    };

    return (
        <ToolWrapper topicKey="dfa-generator">
            <div className="card form-card mb-4"><div className="card-body">
                <h5 className="card-title"><i className="bi bi-play-circle me-2"></i>Generate a DFA for a Specific String</h5>
                <form onSubmit={handleSubmit} className="mt-3">
                    <div className="mb-3">
                        <label htmlFor="alphabet" className="form-label">Alphabet</label>
                        <input type="text" id="alphabet" value={alphabet} onChange={(e) => setAlphabet(e.target.value)} className="form-control" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="accept_string" className="form-label">String to Accept</label>
                        <input type="text" id="accept_string" value={acceptString} onChange={(e) => setAcceptString(e.target.value)} className="form-control" />
                    </div>
                    <button type="submit" disabled={isLoading} className="btn btn-primary w-100">{isLoading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>) : "Generate DFA"}</button>
                </form>
                {error && <div className="alert alert-danger mt-3">{error}</div>}
            </div></div>
            {results && <DfaResultsDisplay results={results} />}
        </ToolWrapper>
    );
};

const NfaGeneratorTool = () => {
    const [regex, setRegex] = useState("(a|b)*a");
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        handleApiSubmit("generate-nfa", { regex }, setResults, setError, setIsLoading);
    };

    return (
        <ToolWrapper topicKey="nfa-generator">
            <div className="card form-card mb-4"><div className="card-body">
                <h5 className="card-title"><i className="bi bi-play-circle me-2"></i>Generate NFA from Regular Expression</h5>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="regex" className="form-label">Regular Expression</label>
                        <input type="text" id="regex" value={regex} onChange={(e) => setRegex(e.target.value)} className="form-control" />
                    </div>
                    <button type="submit" disabled={isLoading} className="btn btn-primary w-100">{isLoading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>) : "Generate NFA"}</button>
                </form>
                {error && <div className="alert alert-danger mt-3">{error}</div>}
            </div></div>
            {results && (<div className="card results-card">
                <div className="card-header fw-bold">Generated NFA</div>
                <div className="card-body text-center"><img src={results.graph_image} alt="NFA Graph" className="img-fluid rounded border" /></div>
            </div>)}
        </ToolWrapper>
    );
};

const NfaToDfaTool = () => {
    const [nfaDefinition, setNfaDefinition] = useState(JSON.stringify({
        states: ["q0", "q1", "q2"], alphabet: ["a", "b"],
        transitions: { "q0": { "a": ["q0", "q1"], "b": ["q0"] }, "q1": { "b": ["q2"] } },
        start_state: "q0", final_states: ["q2"]
    }, null, 2));
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            const nfaData = JSON.parse(nfaDefinition);
            handleApiSubmit("nfa-to-dfa", { nfa: nfaData }, setResults, setError, setIsLoading);
        } catch (err) { setError("Invalid JSON format for NFA definition."); }
    };

    return (
        <ToolWrapper topicKey="nfa-to-dfa">
            <div className="card form-card mb-4"><div className="card-body">
                <h5 className="card-title"><i className="bi bi-play-circle me-2"></i>Convert NFA to DFA</h5>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="nfa-def" className="form-label">NFA Definition (JSON)</label>
                        <textarea id="nfa-def" value={nfaDefinition} onChange={(e) => setNfaDefinition(e.target.value)} className="form-control" rows="12"></textarea>
                    </div>
                    <button type="submit" disabled={isLoading} className="btn btn-primary w-100">{isLoading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Converting...</>) : "Convert"}</button>
                </form>
                {error && <div className="alert alert-danger mt-3">{error}</div>}
            </div></div>
            {results && <DfaResultsDisplay results={results} />}
        </ToolWrapper>
    );
};

const Ll1ParserTool = () => {
    const [grammar, setGrammar] = useState("E -> T E_prime\nE_prime -> + T E_prime | epsilon\nT -> F T_prime\nT_prime -> * F T_prime | epsilon\nF -> ( E ) | id");
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        handleApiSubmit("ll1-parser", { grammar }, setResults, setError, setIsLoading);
    };

    return (
        <ToolWrapper topicKey="ll1-parser">
            <div className="card form-card mb-4"><div className="card-body">
                <h5 className="card-title"><i className="bi bi-play-circle me-2"></i>Generate LL(1) Parse Table</h5>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="grammar-ll1" className="form-label">Grammar (Non-terminals must be uppercase or contain '_')</label>
                        <textarea id="grammar-ll1" value={grammar} onChange={(e) => setGrammar(e.target.value)} className="form-control" rows="8"></textarea>
                    </div>
                    <button type="submit" disabled={isLoading} className="btn btn-primary w-100">{isLoading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>) : "Generate Table"}</button>
                </form>
                {error && <div className="alert alert-danger mt-3">{error}</div>}
            </div></div>
            {results && (
                <div className="card results-card">
                    <div className="card-header fw-bold">LL(1) Results</div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6">
                                <h6 className="fw-semibold">FIRST Sets</h6>
                                <pre className="p-2 bg-light rounded">{JSON.stringify(results.first_sets, null, 2)}</pre>
                            </div>
                            <div className="col-md-6">
                                <h6 className="fw-semibold">FOLLOW Sets</h6>
                                <pre className="p-2 bg-light rounded">{JSON.stringify(results.follow_sets, null, 2)}</pre>
                            </div>
                        </div>
                        <h6 className="fw-semibold mt-4">Parse Table</h6>
                        <div className="table-responsive">
                            <table className="table table-bordered parse-table">
                                <thead><tr><th>Non-Terminal</th>{results.terminals.map(t => <th key={t}>{t}</th>)}</tr></thead>
                                <tbody>
                                    {Object.keys(results.parse_table).sort().map(nt => (
                                        <tr key={nt}><td className="fw-bold">{nt}</td>{results.terminals.map(t => (<td key={t}>{results.parse_table[nt]?.[t] || ''}</td>))}</tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </ToolWrapper>
    );
};

const LrParserTool = () => {
    const [grammar, setGrammar] = useState("S -> a S b | epsilon");
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        handleApiSubmit("slr-parser", { grammar }, setResults, setError, setIsLoading);
    };

    return (
        <ToolWrapper topicKey="lr-parser">
            <div className="card form-card mb-4"><div className="card-body">
                <h5 className="card-title"><i className="bi bi-play-circle me-2"></i>Generate SLR(1) Parse Table</h5>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="grammar-lr" className="form-label">Grammar (Non-terminals must be uppercase or contain '_')</label>
                        <textarea id="grammar-lr" value={grammar} onChange={(e) => setGrammar(e.target.value)} className="form-control" rows="6"></textarea>
                    </div>
                    <button type="submit" disabled={isLoading} className="btn btn-primary w-100">{isLoading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>) : "Generate Table"}</button>
                </form>
                {error && <div className="alert alert-danger mt-3">{error}</div>}
            </div></div>
            {results && (
                <div className="card results-card">
                    <div className="card-header fw-bold">SLR(1) Results</div>
                    <div className="card-body">
                        <h6 className="fw-semibold">Numbered Productions</h6>
                        <ol start="0" className="p-3 bg-light rounded">{results.productions.map((p, i) => <li key={i}><code>({i}) {p}</code></li>)}</ol>
                        
                        <h6 className="fw-semibold mt-4">Canonical LR(0) Item Sets</h6>
                        <pre className="p-2 bg-light rounded">{JSON.stringify(results.item_sets, null, 2)}</pre>
                        
                        <h6 className="fw-semibold mt-4">SLR(1) ACTION/GOTO Table</h6>
                        <div className="table-responsive">
                            <table className="table table-bordered parse-table">
                                <thead>
                                    <tr>
                                        <th rowSpan="2">State</th>
                                        <th colSpan={results.terminals.length}>ACTION</th>
                                        <th colSpan={results.non_terminals.length}>GOTO</th>
                                    </tr>
                                    <tr>
                                        {results.terminals.map(t => <th key={t}>{t}</th>)}
                                        {results.non_terminals.map(nt => <th key={nt}>{nt}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(results.parse_table).sort((a,b) => parseInt(a) - parseInt(b)).map(stateNum => (
                                        <tr key={stateNum}>
                                            <td className="fw-bold">{stateNum}</td>
                                            {results.terminals.map(t => {
                                                const action = results.parse_table[stateNum]?.[t] || '';
                                                const className = action.startsWith('S') ? 'action-shift' : action.startsWith('R') ? 'action-reduce' : action.toLowerCase() === 'accept' ? 'action-accept' : '';
                                                return <td key={t} className={className}>{action.startsWith('R') ? `${action} (${results.productions.findIndex(p => p === action.substring(2))})` : action}</td>
                                            })}
                                            {results.non_terminals.map(nt => <td key={nt}>{results.parse_table[stateNum]?.[nt] || ''}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </ToolWrapper>
    );
};

export default App;







// import React, { useState, useEffect } from "react";
// import "./App.css";

// /* -------------------- Topic Data (ENRICHED WITH FORMAL DEFINITIONS) -------------------- */
// const TOPICS = {
//     "dfa-generator": {
//         title: "DFA: Deterministic Finite Automaton",
//         overview: `A Deterministic Finite Automaton (DFA) is formally defined as a 5-tuple: $$ (Q, \\Sigma, \\delta, q_0, F) $$
//         <ul>
//             <li><b>Q:</b> A finite set of states</li>
//             <li><b>Σ (Sigma):</b> A finite set of input symbols (the alphabet)</li>
//             <li><b>δ (delta):</b> The transition function, where $ \\delta: Q \\times \\Sigma \\rightarrow Q $</li>
//             <li><b>q₀:</b> The initial (start) state, where $ q_0 \\in Q $</li>
//             <li><b>F:</b> A set of accepting (final) states, where $ F \\subseteq Q $</li>
//         </ul>
//         <b>Key property:</b> For each state and input symbol, there is exactly one transition. No ε (epsilon) transitions are allowed.`,
//         steps: [
//             "Start at the initial state $q_0$.",
//             "Read the input string one symbol at a time from left to right.",
//             "For each symbol, use the transition function $ \\delta $ to move from the current state to the next state.",
//             "After the last symbol has been processed, check the current state.",
//             "If the current state is in the set of final states F, the string is <b>accepted</b>.",
//             "Otherwise, the string is <b>rejected</b>."
//         ],
//         example: {
//             problem: `Design a DFA that accepts all binary strings ending with "01".`,
//             solutionSteps: [
//                 "$Q = \\{q_0, q_1, q_2\\}$",
//                 "$\\Sigma = \\{0, 1\\}$",
//                 "$q_0$ is the start state.",
//                 "$F = \\{q_2\\}$ (the only final state).",
//                 `The transition function $ \\delta $ is defined as:
//                 <table class="table table-sm table-bordered mt-2 text-center">
//                     <thead><tr><th>State</th><th>Input '0'</th><th>Input '1'</th></tr></thead>
//                     <tbody>
//                         <tr><td>➡️q₀</td><td>q₁</td><td>q₀</td></tr>
//                         <tr><td>q₁</td><td>q₁</td><td>q₂</td></tr>
//                         <tr><td>*q₂</td><td>q₁</td><td>q₀</td></tr>
//                     </tbody>
//                 </table>`,
//                 "<b>Explanation:</b> The automaton remembers if it has just seen a '0' (state q₁). If it then sees a '1', it moves to the final state q₂. Any other input resets the pattern."
//             ],
//             final: `<b>Test String "10101":</b>
//             <br>1. Start at $q_0$. Read '1'. $ \\delta(q_0, 1) = q_0 $.
//             <br>2. Current state $q_0$. Read '0'. $ \\delta(q_0, 0) = q_1 $.
//             <br>3. Current state $q_1$. Read '1'. $ \\delta(q_1, 1) = q_2 $.
//             <br>4. Current state $q_2$. Read '0'. $ \\delta(q_2, 0) = q_1 $.
//             <br>5. Current state $q_1$. Read '1'. $ \\delta(q_1, 1) = q_2 $.
//             <br>End of string. Current state is $q_2$, which is in F. String is ✅ <b>Accepted</b>.`,
//         },
//     },
//     "nfa-generator": {
//         title: "NFA: Non-deterministic Finite Automaton",
//         overview: `A Non-deterministic Finite Automaton (NFA) is also a 5-tuple, but with a key difference in its transition function: $$ (Q, \\Sigma, \\delta, q_0, F) $$
//         The transition function $ \\delta $ maps to the power set of Q:
//         $$ \\delta: Q \\times (\\Sigma \\cup \\{\\epsilon\\}) \\rightarrow 2^Q $$
//         <b>Key properties:</b>
//         <ul>
//             <li>Can have multiple possible transitions from a state on a single symbol.</li>
//             <li>Can have ε (epsilon) transitions, allowing state changes without consuming input.</li>
//             <li>Accepts a string if at least <b>one</b> possible path ends in a final state.</li>
//         </ul>This tool builds an NFA from a regular expression using <b>Thompson's Construction</b>.`,
//         steps: [
//             "<b>Base Cases:</b> For ε, create two states with an ε-transition. For a symbol 'a', create two states with an 'a' transition.",
//             "<b>Concatenation (ab):</b> The final state of the NFA for 'a' is merged with the initial state of the NFA for 'b'.",
//             "<b>Union (a|b):</b> Create a new start state with ε-transitions to the start states of the NFAs for 'a' and 'b'. Create a new final state, and add ε-transitions from the old final states to this new one.",
//             "<b>Kleene Star (a*):</b> Create new start and final states. Add ε-transitions to create a loop around the NFA for 'a', and also to bypass it entirely."
//         ],
//         example: {
//             problem: "Construct an NFA for the regular expression `(a|b)*a`.",
//             solutionSteps: [
//                 "1. Build simple NFAs for 'a' and 'b'.",
//                 "2. Combine them using the <b>Union</b> rule to create an NFA for `(a|b)`.",
//                 "3. Apply the <b>Kleene Star</b> rule to the `(a|b)` NFA to allow zero or more repetitions.",
//                 "4. Build another simple NFA for the final 'a'.",
//                 "5. Connect the NFA for `(a|b)*` to the final 'a' NFA using the <b>Concatenation</b> rule."
//             ],
//             final: "The resulting NFA non-deterministically loops on 'a' or 'b', then deterministically transitions on a final 'a' to reach the accepting state.",
//         },
//     },
//     "nfa-to-dfa": {
//         title: "NFA → DFA: Subset Construction",
//         overview: "For every NFA, there exists an equivalent DFA. The <b>Subset Construction</b> algorithm systematically converts an NFA to a DFA. Each state in the resulting DFA corresponds to a *set of states* from the NFA.",
//         steps: [
//             "<b>1. ε-closure:</b> First, define a function `ε-closure(S)` that returns the set of all NFA states reachable from any state in set S using only ε-transitions.",
//             "<b>2. Initialize:</b> The start state of the DFA is `ε-closure({q₀})`, where `q₀` is the NFA's start state.",
//             "<b>3. Iterate:</b> Create a worklist containing the new DFA start state. While the worklist is not empty:",
//             "  a) Dequeue a DFA state `S`.",
//             "  b) For each symbol `a` in the alphabet, compute `move(S, a)`: the set of NFA states reachable from `S` on input `a`.",
//             "  c) The new DFA state is `T = ε-closure(move(S, a))`. Add the transition `δ(S, a) = T`.",
//             "  d) If `T` is a new state, add it to the worklist.",
//             "<b>4. Final States:</b> Any DFA state that contains at least one of the NFA's original final states is marked as a final state in the DFA."
//         ],
//         example: {
//             problem: "Convert an NFA with states ${q_0, q_1}$, start $q_0$, final ${q_1}$. Transitions: $ \\delta(q_0, a) = \\{q_0, q_1\\} $, $ \\delta(q_0, b) = \\{q_1\\} $.",
//             solutionSteps: [
//                 "DFA Start State (A): `ε-closure({q₀})` = `{q₀}`. So, A = `{q₀}`.",
//                 "From A on 'a': `move(A, a)` = `{q₀, q₁}`. `ε-closure({q₀, q₁})` = `{q₀, q₁}`. Let's call this new state B.",
//                 "From A on 'b': `move(A, b)` = `{q₁}`. `ε-closure({q₁})` = `{q₁}`. Let's call this new state C.",
//                 "From B (`{q₀, q₁}`) on 'a': `move(B, a)` = `δ(q₀,a) ∪ δ(q₁,a)` = `{q₀, q₁}`. So, B goes to B on 'a'.",
//                 "From B (`{q₀, q₁}`) on 'b': `move(B, b)` = `δ(q₀,b) ∪ δ(q₁,b)` = `{q₁}`. So, B goes to C on 'b'.",
//                 "From C (`{q₁}`) on 'a' or 'b': There are no outgoing transitions, so it goes to an empty (trap) state.",
//                 "Final States: B and C both contain the original NFA final state `q₁`, so they are final states in the DFA."
//             ],
//             final: "The resulting DFA has states A=`{q₀}`, B=`{q₀,q₁}`, C=`{q₁}`, where B and C are final states.",
//         },
//     },
//     "ll1-parser": {
//         title: "LL(1) Parser Generator",
//         overview: "An LL(1) parser is a top-down parser that constructs a leftmost derivation. It's called LL(1) because it processes input from <b>L</b>eft to right, produces a <b>L</b>eftmost derivation, and uses <b>1</b> lookahead symbol. It relies on a pre-computed parsing table to make deterministic decisions. For a grammar to be LL(1), it must not be ambiguous or left-recursive.",
//         steps: [
//             "<b>Compute FIRST sets:</b> For each grammar symbol X, `FIRST(X)` is the set of terminals that can begin a string derived from X. If X can derive ε, then ε is in `FIRST(X)`.",
//             "<b>Compute FOLLOW sets:</b> For each non-terminal A, `FOLLOW(A)` is the set of terminals that can appear immediately to the right of A. The end-of-input marker '$' is in the `FOLLOW` set of the start symbol.",
//             "<b>Construct the Parse Table M:</b> For each production A → α:",
//             "  a) For each terminal `t` in `FIRST(α)`, add A → α to `M[A, t]`.",
//             "  b) If ε is in `FIRST(α)`, then for each terminal `t` in `FOLLOW(A)`, add A → α to `M[A, t]`.",
//             "<b>Check for Conflicts:</b> If any cell in the table `M` contains more than one production, the grammar is not LL(1)."
//         ],
//         example: {
//             problem: "For the classic expression grammar:<br>$E \\rightarrow T E'$<br>$E' \\rightarrow + T E' | \\epsilon$<br>$T \\rightarrow F T'$<br>$T' \\rightarrow * F T' | \\epsilon$<br>$F \\rightarrow ( E ) | id$",
//             solutionSteps: [
//                 "FIRST(E) = FIRST(T) = FIRST(F) = { '(', 'id' }",
//                 "FOLLOW(E) = { '$', ')' }",
//                 "FOLLOW(E') = FOLLOW(E) = { '$', ')' }",
//                 "Table Entry `M[E', +]`: The production is $E' \\rightarrow + T E'$. `FIRST(+ T E')` is `{ '+' }`. So, add the production to `M[E', +]`.",
//                 "Table Entry `M[E', )]`: The production is $E' \\rightarrow \\epsilon$. `FIRST(ε)` is `{ ε }`. We must look at `FOLLOW(E')`, which is `{ '$', ')' }`. So, add $E' \\rightarrow \\epsilon$ to `M[E', )]` and `M[E', $]`."
//             ],
//             final: "The completed table guides the parser. When considering non-terminal E' and seeing input '+', it applies $E' \\rightarrow + T E'$. If it sees ')' or '$', it applies $E' \\rightarrow \\epsilon$.",
//         },
//     },
//     "lr-parser": {
//         title: "SLR(1) Parser Generator",
//         overview: "An SLR(1) parser is a bottom-up parser that is more powerful than an LL(1) parser. It reads input from <b>L</b>eft to right, producing a <b>R</b>ightmost derivation in reverse, using <b>1</b> lookahead symbol. It works by shifting tokens onto a stack and reducing them when the top of the stack matches the right-hand side of a grammar rule (a handle).",
//         steps: [
//             "<b>Augment the Grammar:</b> Add a new start production $S' \\rightarrow S$, where S is the original start symbol.",
//             "<b>Create LR(0) Items:</b> An LR(0) item is a production with a dot '.' on the right-hand side, indicating how much of the production has been seen (e.g., $A \\rightarrow x . y$).",
//             "<b>Compute `closure()` and `goto()`:</b> The `closure` operation finds all items implied by a set of items. The `goto` function defines the transitions between sets of items (states).",
//             "<b>Build Canonical Collection of Items:</b> These sets of items are the states of the parser's underlying automaton.",
//             "<b>Construct ACTION/GOTO Table:</b>",
//             "  a) <b>Shift:</b> If state `I` contains item $[A \\rightarrow \\alpha . a \\beta]$ and `goto(I, a) = J`, set `ACTION[I, a] = shift J`.",
//             "  b) <b>Reduce:</b> If state `I` contains a final item $[A \\rightarrow \\alpha .]$, then for every terminal `t` in `FOLLOW(A)`, set `ACTION[I, t] = reduce A \\rightarrow \\alpha`.",
//             "  c) <b>Accept:</b> If state `I` contains $[S' \\rightarrow S .]$, set `ACTION[I, $] = accept`."
//         ],
//         example: {
//             problem: "For the grammar $S \\rightarrow a S b | c$",
//             solutionSteps: [
//                 "1. Augment: $S' \\rightarrow S$",
//                 "2. Initial State (I₀): `closure({[S' -> .S]})` gives the set { $[S' \\rightarrow .S]$, $[S \\rightarrow .a S b]$, $[S \\rightarrow .c]$ }.",
//                 "3. Compute Transitions: `goto(I₀, a)` creates a new state containing $[S \\rightarrow a .S b]$ and its closure. `goto(I₀, c)` creates a state with $[S \\rightarrow c .]$.",
//                 "4. Build Table: In state I₀, on input 'a', the table action is 'Shift'. On 'c', it is also 'Shift'.",
//                 "5. Reduce Action: In the state containing $[S \\rightarrow c .]$, for any terminal `t` in `FOLLOW(S)` (which includes 'b' and '$'), the table action is 'Reduce using $S \\rightarrow c$`."
//             ],
//             final: "The SLR table uses FOLLOW sets to decide when to reduce. A shift-reduce conflict occurs if a state contains both a shift and a reduce action for the same terminal. A reduce-reduce conflict occurs if there are two possible reduce actions.",
//         },
//     },
// };

// /* -------------------- Main App Component -------------------- */
// function App() {
//     useEffect(() => {
//         // This is a workaround to get MathJax to re-render when the content changes.
//         if (window.MathJax) {
//             window.MathJax.typesetPromise();
//         }
//     });

//     const [activeTool, setActiveTool] = useState("welcome");

//     const renderContent = () => {
//         switch (activeTool) {
//             case "dfa-generator": return <DfaGeneratorTool />;
//             case "nfa-generator": return <NfaGeneratorTool />;
//             case "nfa-to-dfa": return <NfaToDfaTool />;
//             case "ll1-parser": return <Ll1ParserTool />;
//             case "lr-parser": return <LrParserTool />;
//             default: return <WelcomeContent />;
//         }
//     };

//     return (
//         <>
//             <Header />
//             <div className="container-fluid">
//                 <div className="row">
//                     <Sidebar setActiveTool={setActiveTool} />
//                     <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main-content">
//                         {renderContent()}
//                     </main>
//                 </div>
//             </div>
//         </>
//     );
// }

// /* -------------------- Reusable UI Components -------------------- */
// const Header = () => (
//     <header className="navbar navbar-dark sticky-top shadow-sm custom-navbar">
//         <a className="navbar-brand col-md-3 col-lg-2 me-0 px-3 fs-6" href="#">
//             <i className="bi bi-diagram-3-fill me-2"></i> Automata & Compiler Lab
//         </a>
//     </header>
// );

// const Sidebar = ({ setActiveTool }) => {
//     const [active, setActive] = useState("welcome");

//     const handleClick = (tool) => {
//         setActive(tool);
//         setActiveTool(tool);
//     };

//     return (
//         <nav id="sidebarMenu" className="col-md-3 col-lg-2 d-md-block sidebar collapse">
//             <div className="position-sticky pt-3 sidebar-sticky">
//                 <ul className="nav flex-column">
//                     <li className="nav-item">
//                         <a href="#" className={`nav-link ${active === "welcome" ? "active" : ""}`} onClick={() => handleClick("welcome")}>
//                             <i className="bi bi-house-door-fill me-2"></i> Home
//                         </a>
//                     </li>
//                     <li className="nav-item">
//                         <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#fa-submenu">
//                             <i className="bi bi-gear-wide-connected me-2"></i> Finite Automata
//                         </a>
//                         <div className="collapse show" id="fa-submenu">
//                             <ul className="nav flex-column ms-3">
//                                 <li className="nav-item">
//                                     <a href="#" className={`nav-link ${active === "dfa-generator" ? "active" : ""}`} onClick={() => handleClick("dfa-generator")}>DFA Generator</a>
//                                 </li>
//                                 <li className="nav-item">
//                                     <a href="#" className={`nav-link ${active === "nfa-generator" ? "active" : ""}`} onClick={() => handleClick("nfa-generator")}>NFA Generator</a>
//                                 </li>
//                                 <li className="nav-item">
//                                     <a href="#" className={`nav-link ${active === "nfa-to-dfa" ? "active" : ""}`} onClick={() => handleClick("nfa-to-dfa")}>NFA to DFA</a>
//                                 </li>
//                             </ul>
//                         </div>
//                     </li>
//                     <li className="nav-item">
//                          <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#parser-submenu">
//                             <i className="bi bi-file-earmark-code me-2"></i> Parsers
//                         </a>
//                         <div className="collapse show" id="parser-submenu">
//                              <ul className="nav flex-column ms-3">
//                                 <li className="nav-item">
//                                     <a href="#" className={`nav-link ${active === "ll1-parser" ? "active" : ""}`} onClick={() => handleClick("ll1-parser")}>LL(1) Parser</a>
//                                 </li>
//                                 <li className="nav-item">
//                                     <a href="#" className={`nav-link ${active === "lr-parser" ? "active" : ""}`} onClick={() => handleClick("lr-parser")}>SLR(1) Parser</a>
//                                 </li>
//                              </ul>
//                         </div>
//                     </li>
//                 </ul>
//             </div>
//         </nav>
//     );
// };


// const WelcomeContent = () => (
//     <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
//         <div className="welcome-card text-center shadow-sm">
//             <h1 className="display-5 mb-3">Welcome to the Lab</h1>
//             <p className="lead text-muted">Select a tool from the sidebar to begin exploring automata and compiler design concepts.</p>
//             <i className="bi bi-box-arrow-in-left display-1 mt-3 text-primary"></i>
//         </div>
//     </div>
// );

// // --- IMPORTANT: This component now uses `dangerouslySetInnerHTML` to render HTML/LaTeX ---
// const TopicInfoPanel = ({ topicKey }) => {
//     const topic = TOPICS[topicKey];
    
//     useEffect(() => {
//         if (window.MathJax) {
//             window.MathJax.typesetPromise();
//         }
//     }, [topicKey]); // Rerun when the topic changes

//     return (
//         <div className="card info-card mb-4">
//             <div className="card-body">
//                 <h5 className="card-title"><i className="bi bi-info-circle me-2"></i>How it Works</h5>
//                 <p className="card-text" dangerouslySetInnerHTML={{ __html: topic.overview }} />
//                 <div className="accordion mt-4" id={`accordion-${topicKey}`}>
//                     <div className="accordion-item">
//                         <h2 className="accordion-header">
//                             <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-steps-${topicKey}`}>Step-by-step Process</button>
//                         </h2>
//                         <div id={`collapse-steps-${topicKey}`} className="accordion-collapse collapse" data-bs-parent={`#accordion-${topicKey}`}>
//                             <div className="accordion-body topic-steps">
//                                 <ol>{topic.steps.map((s, i) => <li key={i} dangerouslySetInnerHTML={{ __html: s }} />)}</ol>
//                             </div>
//                         </div>
//                     </div>
//                     <div className="accordion-item">
//                         <h2 className="accordion-header">
//                             <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-example-${topicKey}`}>Worked Example</button>
//                         </h2>
//                         <div id={`collapse-example-${topicKey}`} className="accordion-collapse collapse" data-bs-parent={`#accordion-${topicKey}`}>
//                             <div className="accordion-body solution-card">
//                                 <h6 className="fw-semibold">Problem</h6>
//                                 <p className="mb-3" dangerouslySetInnerHTML={{ __html: topic.example.problem }} />
//                                 <h6 className="fw-semibold">Solution — steps</h6>
//                                 <ol>{topic.example.solutionSteps.map((ss, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: ss }} />)}</ol>
//                                 <div className="mt-3">
//                                     <h6 className="fw-semibold">Final / Result</h6>
//                                     <div dangerouslySetInnerHTML={{ __html: topic.example.final }} />
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// const DfaResultsDisplay = ({ results }) => (
//     <div className="card results-card">
//         <div className="card-header fw-bold">Results: Transition Table</div>
//         <div className="card-body">
//             <div className="table-responsive mb-3">
//                 <table className="table table-bordered text-center">
//                     <thead>
//                         <tr>
//                             <th>State</th>
//                             {results.dfa.alphabet.map((c) => <th key={c}>{c}</th>)}
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {results.dfa.states.map((state) => (
//                             <tr key={state}>
//                                 <td className="fw-medium">
//                                     {state === results.dfa.start_state && "➡️ "}
//                                     {results.dfa.final_states.includes(state) && "*"}
//                                     {state}
//                                 </td>
//                                 {results.dfa.alphabet.map((symbol) => (
//                                     <td key={symbol}>{results.dfa.transitions[`${state},${symbol}`] || "—"}</td>
//                                 ))}
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//             <div className="text-center">
//                 <img src={results.graph_image} alt="DFA Graph" className="img-fluid rounded border" />
//             </div>
//         </div>
//     </div>
// );

// /* -------------------- Tool Implementations -------------------- */
// const ToolWrapper = ({ topicKey, children }) => (
//     <>
//         <div className="section-header"><h1 className="h2">{TOPICS[topicKey].title}</h1></div>
//         <div className="row g-4 justify-content-center">
//             <div className="col-lg-12"><TopicInfoPanel topicKey={topicKey} /></div>
//             <div className="col-lg-10 col-md-12">{children}</div>
//         </div>
//     </>
// );

// const handleApiSubmit = async (endpoint, body, setResults, setError, setIsLoading) => {
//     setResults(null);
//     setError("");
//     setIsLoading(true);
//     try {
//         const response = await fetch(`http://127.0.0.1:8000/api/${endpoint}/`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(body),
//         });
//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
//         }
//         const data = await response.json();
//         setResults(data);
//     } catch (err) {
//         setError(err.message);
//     } finally {
//         setIsLoading(false);
//     }
// };

// const DfaGeneratorTool = () => {
//     const [alphabet, setAlphabet] = useState("ab");
//     const [acceptString, setAcceptString] = useState("aba");
//     const [results, setResults] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         if (acceptString && ![...acceptString].every((char) => alphabet.includes(char))) {
//             setError(`Error: The string '${acceptString}' contains characters not in the alphabet '${alphabet}'.`);
//             return;
//         }
//         handleApiSubmit("generate-dfa", { alphabet, accept_string: acceptString }, setResults, setError, setIsLoading);
//     };

//     return (
//         <ToolWrapper topicKey="dfa-generator">
//             <div className="card form-card mb-4">
//                 <div className="card-body">
//                     <h5 className="card-title"><i className="bi bi-play-circle me-2"></i>Generate a DFA for a Specific String</h5>
//                     <form onSubmit={handleSubmit} className="mt-3">
//                         <div className="mb-3">
//                             <label htmlFor="alphabet" className="form-label">Alphabet (e.g., ab01)</label>
//                             <input type="text" id="alphabet" value={alphabet} onChange={(e) => setAlphabet(e.target.value)} className="form-control" />
//                         </div>
//                         <div className="mb-3">
//                             <label htmlFor="accept_string" className="form-label">String to Accept</label>
//                             <input type="text" id="accept_string" value={acceptString} onChange={(e) => setAcceptString(e.target.value)} className="form-control" />
//                         </div>
//                         <button type="submit" disabled={isLoading} className="btn btn-primary w-100">
//                             {isLoading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>) : "Generate DFA"}
//                         </button>
//                     </form>
//                     {error && <div className="alert alert-danger mt-3">{error}</div>}
//                 </div>
//             </div>
//             {results && <DfaResultsDisplay results={results} />}
//         </ToolWrapper>
//     );
// };

// const NfaGeneratorTool = () => {
//     const [regex, setRegex] = useState("(a|b)*a");
//     const [results, setResults] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         handleApiSubmit("generate-nfa", { regex }, setResults, setError, setIsLoading);
//     };

//     return (
//         <ToolWrapper topicKey="nfa-generator">
//             <div className="card form-card mb-4">
//                 <div className="card-body">
//                     <h5 className="card-title"><i className="bi bi-play-circle me-2"></i>Generate NFA from Regular Expression</h5>
//                     <form onSubmit={handleSubmit}>
//                         <div className="mb-3">
//                             <label htmlFor="regex" className="form-label">Regular Expression</label>
//                             <input type="text" id="regex" value={regex} onChange={(e) => setRegex(e.target.value)} className="form-control" />
//                         </div>
//                         <button type="submit" disabled={isLoading} className="btn btn-primary w-100">
//                             {isLoading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>) : "Generate NFA"}
//                         </button>
//                     </form>
//                     {error && <div className="alert alert-danger mt-3">{error}</div>}
//                 </div>
//             </div>
//             {results && (
//                 <div className="card results-card">
//                     <div className="card-header fw-bold">Generated NFA</div>
//                     <div className="card-body text-center">
//                          <img src={results.graph_image} alt="NFA Graph" className="img-fluid rounded border" />
//                     </div>
//                 </div>
//             )}
//         </ToolWrapper>
//     );
// };

// const NfaToDfaTool = () => {
//     const [nfaDefinition, setNfaDefinition] = useState(JSON.stringify({
//         states: ["q0", "q1", "q2"],
//         alphabet: ["a", "b"],
//         transitions: {
//             "q0": { "a": ["q0", "q1"], "b": ["q0"] },
//             "q1": { "b": ["q2"] }
//         },
//         start_state: "q0",
//         final_states: ["q2"]
//     }, null, 2));
//     const [results, setResults] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         try {
//             const nfaData = JSON.parse(nfaDefinition);
//             handleApiSubmit("nfa-to-dfa", { nfa: nfaData }, setResults, setError, setIsLoading);
//         } catch (err) {
//             setError("Invalid JSON format for NFA definition.");
//         }
//     };

//     return (
//         <ToolWrapper topicKey="nfa-to-dfa">
//             <div className="card form-card mb-4">
//                 <div className="card-body">
//                     <h5 className="card-title"><i className="bi bi-play-circle me-2"></i>Convert NFA to DFA</h5>
//                     <form onSubmit={handleSubmit}>
//                         <div className="mb-3">
//                             <label htmlFor="nfa-def" className="form-label">NFA Definition (JSON)</label>
//                             <textarea id="nfa-def" value={nfaDefinition} onChange={(e) => setNfaDefinition(e.target.value)} className="form-control" rows="12"></textarea>
//                         </div>
//                         <button type="submit" disabled={isLoading} className="btn btn-primary w-100">
//                             {isLoading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Converting...</>) : "Convert"}
//                         </button>
//                     </form>
//                     {error && <div className="alert alert-danger mt-3">{error}</div>}
//                 </div>
//             </div>
//             {results && <DfaResultsDisplay results={results} />}
//         </ToolWrapper>
//     );
// };

// const Ll1ParserTool = () => {
//     const [grammar, setGrammar] = useState("E -> T E_prime\nE_prime -> + T E_prime | epsilon\nT -> F T_prime\nT_prime -> * F T_prime | epsilon\nF -> ( E ) | id");
//     const [results, setResults] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         handleApiSubmit("ll1-parser", { grammar }, setResults, setError, setIsLoading);
//     };

//     return (
//         <ToolWrapper topicKey="ll1-parser">
//             <div className="card form-card mb-4">
//                 <div className="card-body">
//                     <h5 className="card-title"><i className="bi bi-play-circle me-2"></i>Generate LL(1) Parse Table</h5>
//                     <form onSubmit={handleSubmit}>
//                         <div className="mb-3">
//                             <label htmlFor="grammar-ll1" className="form-label">Grammar (one rule per line, use 'epsilon')</label>
//                             <textarea id="grammar-ll1" value={grammar} onChange={(e) => setGrammar(e.target.value)} className="form-control" rows="8"></textarea>
//                         </div>
//                         <button type="submit" disabled={isLoading} className="btn btn-primary w-100">
//                             {isLoading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>) : "Generate Table"}
//                         </button>
//                     </form>
//                     {error && <div className="alert alert-danger mt-3">{error}</div>}
//                 </div>
//             </div>
//             {results && (
//                 <div className="card results-card">
//                     <div className="card-header fw-bold">LL(1) Results</div>
//                     <div className="card-body">
//                         <div className="row">
//                             <div className="col-md-6">
//                                 <h6 className="fw-semibold">FIRST Sets</h6>
//                                 <pre className="p-2 bg-light rounded">{JSON.stringify(results.first_sets, null, 2)}</pre>
//                             </div>
//                             <div className="col-md-6">
//                                 <h6 className="fw-semibold">FOLLOW Sets</h6>
//                                 <pre className="p-2 bg-light rounded">{JSON.stringify(results.follow_sets, null, 2)}</pre>
//                             </div>
//                         </div>
//                         <h6 className="fw-semibold mt-4">Parse Table</h6>
//                         <div className="table-responsive">
//                             <table className="table table-bordered parse-table">
//                                 {/* Dynamic rendering of the parse table would go here */}
//                                 <thead><tr><th>Non-Terminal</th>{Object.keys(results.terminals).sort().map(t => <th key={t}>{t}</th>)}</tr></thead>
//                                 <tbody>
//                                     {Object.keys(results.parse_table).sort().map(nt => (
//                                         <tr key={nt}><td className="fw-bold">{nt}</td>{Object.keys(results.terminals).sort().map(t => (<td key={t}>{results.parse_table[nt][t] || ''}</td>))}</tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </ToolWrapper>
//     );
// };

// const LrParserTool = () => {
//     const [grammar, setGrammar] = useState("S -> a S b | epsilon");
//     const [results, setResults] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         handleApiSubmit("slr-parser", { grammar }, setResults, setError, setIsLoading);
//     };

//     const terminals = results ? results.terminals.sort() : [];
//     const nonTerminals = results ? results.non_terminals.sort() : [];

//     return (
//         <ToolWrapper topicKey="lr-parser">
//             <div className="card form-card mb-4">
//                 <div className="card-body">
//                     <h5 className="card-title"><i className="bi bi-play-circle me-2"></i>Generate SLR(1) Parse Table</h5>
//                     <form onSubmit={handleSubmit}>
//                         <div className="mb-3">
//                             <label htmlFor="grammar-lr" className="form-label">Grammar (one rule per line, use 'epsilon')</label>
//                             <textarea id="grammar-lr" value={grammar} onChange={(e) => setGrammar(e.target.value)} className="form-control" rows="6"></textarea>
//                         </div>
//                         <button type="submit" disabled={isLoading} className="btn btn-primary w-100">
//                             {isLoading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>) : "Generate Table"}
//                         </button>
//                     </form>
//                     {error && <div className="alert alert-danger mt-3">{error}</div>}
//                 </div>
//             </div>
//             {results && (
//                 <div className="card results-card">
//                     <div className="card-header fw-bold">SLR(1) Results</div>
//                     <div className="card-body">
//                         <h6 className="fw-semibold">Numbered Productions</h6>
//                         <ol start="0" className="p-3 bg-light rounded">
//                             {results.productions.map((p, i) => <li key={i}><code>{p}</code></li>)}
//                         </ol>
                        
//                         <h6 className="fw-semibold mt-4">Canonical LR(0) Item Sets (States)</h6>
//                         <pre className="p-2 bg-light rounded">{JSON.stringify(results.item_sets, null, 2)}</pre>
                        
//                         <h6 className="fw-semibold mt-4">SLR(1) ACTION/GOTO Table</h6>
//                         <div className="table-responsive">
//                             <table className="table table-bordered parse-table">
//                                 <thead>
//                                     <tr>
//                                         <th rowSpan="2">State</th>
//                                         <th colSpan={terminals.length}>ACTION</th>
//                                         <th colSpan={nonTerminals.length}>GOTO</th>
//                                     </tr>
//                                     <tr>
//                                         {terminals.map(t => <th key={t}>{t}</th>)}
//                                         {nonTerminals.map(nt => <th key={nt}>{nt}</th>)}
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {Object.keys(results.parse_table).sort((a,b) => parseInt(a) - parseInt(b)).map(stateNum => (
//                                         <tr key={stateNum}>
//                                             <td className="fw-bold">{stateNum}</td>
//                                             {terminals.map(t => {
//                                                 const action = results.parse_table[stateNum]?.[t] || '';
//                                                 const className = action.startsWith('S') ? 'action-shift' : action.startsWith('R') ? 'action-reduce' : action === 'Accept' ? 'action-accept' : '';
//                                                 return <td key={t} className={className}>{action}</td>
//                                             })}
//                                             {nonTerminals.map(nt => <td key={nt}>{results.parse_table[stateNum]?.[nt] || ''}</td>)}
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </ToolWrapper>
//     );
// };

// export default App;












// import React, { useState } from "react";
// import "./App.css";

// /* -------------------- Topic Data (centralized & simplified) -------------------- */
// // const TOPICS = {
// //     "dfa-generator": {
// //         title: "DFA Generator for a Specific String",
// //         overview: "This tool builds a Deterministic Finite Automaton (DFA) that is programmed to accept only one specific word and reject everything else. It works by creating a 'happy path' for the target word and a 'trap state' for any deviation.",
// //         steps: [
// //             "1. Plan the 'Happy Path': Create a straight path of states that spells out your target word. For 'cat', you'd need a start state, one for 'c', one for 'a', and a final one for 't'.",
// //             "2. Add the 'Trap' State: Create one extra state, often called a 'dead' or 'trap' state. This is where the robot goes if it reads a letter that isn't on the happy path.",
// //             "3. Define the Rules: For every state on the happy path, add a rule for the correct next letter to follow the path. For all *other* letters, add a rule that sends the robot to the trap state.",
// //             "4. The Trap is Forever: Once the robot enters the trap state, it can never leave. Any letter it reads will just keep it there.",
// //         ],
// //         example: {
// //             problem: "Let's build a simple DFA that accepts only the word 'if'. The alphabet is {i, f, x}.",
// //             solutionSteps: [ "Happy Path: We need three states: q0 (start), q1, and q2 (the final, accepting state).", "Path Rules: Add a rule for q0 to go to q1 on letter 'i'. Then add a rule for q1 to go to q2 on letter 'f'.", "Trap State: We create a state q_trap.", "Trap Rules: From q0, if the letter is 'f' or 'x', go to q_trap. From q1, if the letter is 'i' or 'x', go to q_trap. Once in q_trap, stay there for any letter." ],
// //             final: "The robot only reaches the happy final state q2 if it reads exactly 'i' then 'f'. Any other sequence leads to the trap.",
// //         },
// //     },
// //     "nfa-generator": {
// //         title: "NFA from Regular Expression",
// //         overview: "An NFA is a more 'imaginative' version of a DFA. It can explore multiple paths at once. A 'Regular Expression' is a powerful way to describe a text pattern, and this tool uses Thompson's Construction algorithm to build an NFA that recognizes any text matching your pattern.",
// //         steps: [ "1. Break Down the Pattern: A regular expression like 'a(b|c)*' is made of simple parts: the letter 'a', the choice 'b or c', and the 'zero or more' star.", "2. Build Tiny Machines: Create a very simple two-state NFA for each individual letter.", "3. Combine for Choices (OR / |): To handle 'b|c', create a new start state with free (ε) moves to the 'b' machine and the 'c' machine.", "4. Combine for Sequences (Concatenation): To handle 'ab', simply connect the end of the 'a' machine to the start of the 'b' machine.", "5. Combine for Loops (*): To handle 'c*', add free (ε) moves that allow the 'c' machine to be skipped entirely or repeated forever." ],
// //         example: {
// //             problem: "Construct an NFA for the simple pattern 'a(b|c)'. This means 'an a, followed by either a b or a c'.",
// //             solutionSteps: [ "Machine A: Create a simple NFA for 'a'.", "Machine B: Create a simple NFA for 'b'.", "Machine C: Create a simple NFA for 'c'.", "Combine B and C: Make a new start state that has ε-moves to the starts of Machine B and Machine C. This creates the 'b|c' choice.", "Connect A: Connect the end of Machine A to the start of our new 'b|c' machine." ],
// //             final: "The final NFA has two possible successful paths: one for the word 'ab' and one for the word 'ac'.",
// //         },
// //     },
// //     "nfa-to-dfa": {
// //         title: "NFA → DFA (Subset Construction)",
// //         overview: "This tool converts a flexible NFA into a deterministic DFA that accepts the exact same language. The main trick is to create 'super-states' in the DFA, where each super-state represents a *set* of all the states the NFA could possibly be in at that moment.",
// //         steps: [ "1. Find Your Starting Point: The first 'super-state' of your new DFA is the set containing the NFA's start state (and any state reachable via ε-moves).", "2. Explore from a Super-State: Pick a super-state and an alphabet letter (e.g., 'a'). Find all the states the NFA could go to from any of the states inside your super-state on that letter.", "3. Create a New Super-State: Group all those possible destinations (including their ε-closures) into a new set. This set is your next super-state.", "4. Repeat: Keep repeating steps 2 and 3 for every new super-state you create, until you don't find any new ones.", "5. Mark the Final States: Any super-state that contains at least one of the NFA's original final states becomes a final state in your new DFA." ],
// //         example: {
// //             problem: "Imagine an NFA with two states {q0, q1}, where q1 is final. From q0, on 'a', it can go to *both* q0 and q1. On 'b', it only goes to q0.",
// //             solutionSteps: [ "DFA Start State: The NFA starts at q0, so our first DFA super-state is A = {q0}.", "From A on 'b': An NFA in state q0 goes to q0 on 'b'. So, in our DFA, state A goes to A on 'b'.", "From A on 'a': An NFA in state q0 can go to q0 or q1. So we group them into a new super-state: B = {q0, q1}.", "Mark Final States: Our new state B contains q1, which was a final state in the NFA. Therefore, B is a final state in our DFA!" ],
// //             final: "We have created a DFA where the state 'B' represents the moment the NFA could be in either state q0 or q1.",
// //         },
// //     },
// //     "ll1-parser": {
// //         title: "LL(1) Parser Generator",
// //         overview: "An LL(1) parser is a 'predictive' parser; it reads code from **L**eft to right and creates a **L**eftmost derivation by looking just **1** symbol ahead. To do this, it uses a 'cheat sheet' called a parse table, which tells it exactly which grammar rule to apply based on the current non-terminal and the next input token.",
// //         steps: [ "1. Find the 'FIRST' Sets: For each non-terminal, find all the terminals it can begin with. If a non-terminal can derive an empty string, 'epsilon' is in its FIRST set.", "2. Find the 'FOLLOW' Sets: For each non-terminal, find all the terminals that can appear immediately *after* it in a valid string. The special symbol '$' (end of input) is in the FOLLOW set of the start symbol.", "3. Build the Parse Table: For each grammar rule A -> α, place the rule in the table at [A, t] for every terminal 't' in FIRST(α). If 'epsilon' is in FIRST(α), place the rule at [A, t] for every terminal 't' in FOLLOW(A).", "4. Check for Conflicts: If we ever try to put two different rules in the same cell of the table, the grammar is not LL(1) and cannot be parsed this way." ],
// //         example: {
// //             problem: "Grammar: `A -> x y | z`. What does the parse table look like?",
// //             solutionSteps: [ "FIRST(A): A can start with 'x' or 'z'. So, FIRST(A) = {x, z}.", "Parse Table Entry for 'x': In the row for 'A' and the column for 'x', we put the rule 'A -> x y'.", "Parse Table Entry for 'z': In the row for 'A' and the column for 'z', we put the rule 'A -> z'." ],
// //             final: "The parse table clearly tells the parser which rule to choose based on the next word, making parsing fast and predictable.",
// //         },
// //     },
// //     "lr-parser": {
// //         title: "SLR(1) Parser Generator",
// //         overview: "An SLR(1) parser is a more powerful 'bottom-up' parser. It reads code from **L**eft to right, creating a **R**ightmost derivation in reverse by looking **1** symbol ahead. It 'shifts' tokens onto a stack and 'reduces' them back to non-terminals once a complete grammar rule handle is found.",
// //         steps: [ "1. Augment the Grammar: Add a new start rule `S' -> S`, where S is the original start symbol. This gives the parser a clear 'accept' state.", "2. Create 'LR(0) Items': An item is a grammar rule with a dot inside, like a bookmark, showing how much of it we've seen (e.g., `A -> x . y`).", "3. Build Canonical Collection: Group items into sets (states). Use 'closure' to add all implied items and 'goto' to find transitions between states.", "4. Build the ACTION/GOTO Table: The ACTION part tells the parser whether to 'shift', 'reduce', or 'accept' based on the current state and next terminal. The GOTO part tells it which state to go to after a shift or reduce on a non-terminal. SLR uses FOLLOW sets to decide where to place 'reduce' actions." ],
// //         example: {
// //             problem: "Grammar: `E -> E + T | T`, `T -> id`. How does it parse `id + id`?",
// //             solutionSteps: [ "Shift 'id': The parser reads 'id', shifts it, and moves to a state containing `T -> id .`.", "Reduce: It's at the end of a rule. It reduces 'id' back to 'T'.", "Shift '+': Now seeing a '+', it shifts it and moves to a new state.", "Shift 'id': It sees the second 'id', shifts it, and moves to a state with `T -> id .` again.", "Reduce: It reduces the second 'id' to 'T'. The stack now looks like `E + T`. This matches the rule `E -> E + T`, so it reduces again to just 'E'." ],
// //             final: "By shifting tokens onto a stack and reducing them according to grammar rules, the SLR parser can handle a wider class of grammars than LL(1).",
// //         },
// //     },
// // };


// // const TOPICS = {
// //     "dfa-generator": {
// //         title: "DFA Generator for a Specific String",
// //         overview: "A Deterministic Finite Automaton (DFA) is an abstract machine that recognizes patterns. It is 'deterministic' because for any given state and input symbol, there is exactly one state to move to. A DFA is formally defined as a 5-tuple (Q, Σ, δ, q₀, F) where Q is a set of states, Σ is the alphabet, δ is the transition function, q₀ is the start state, and F is the set of final states. This tool builds a simple DFA to accept one specific string.",
// //         steps: [
// //             "1. Define States: Create a unique state for each prefix of the target string, plus a start state (q₀) and a trap state.",
// //             "2. 'Happy Path' Transitions: For the string 'w = a₁a₂...aₙ', create transitions δ(qᵢ₋₁, aᵢ) = qᵢ for i from 1 to n. This forms the path for the accepted string.",
// //             "3. Add Trap Transitions: From any state qᵢ on the happy path, if the input symbol 'c' is not the correct next character in the string, create a transition to a non-final 'trap' state.",
// //             "4. Finalize the Automaton: The state corresponding to the full string 'w' is the only final state. The trap state transitions to itself on all inputs."
// //         ],
// //         example: {
// //             problem: "Construct a DFA that accepts only the string 'aba' over the alphabet {a, b}.",
// //             solutionSteps: [
// //                 "States: We need states for prefixes '', 'a', 'ab', 'aba'. Let's call them q0, q1, q2, q3. We also need a q_trap.",
// //                 "Start & Final: q0 is the start state. q3 is the final state.",
// //                 "Happy Path: δ(q0, a) = q1; δ(q1, b) = q2; δ(q2, a) = q3.",
// //                 "Trap Rules: δ(q0, b) = q_trap; δ(q1, a) = q_trap; δ(q2, b) = q_trap. Any input from q3 or q_trap also goes to q_trap."
// //             ],
// //             final: "The DFA will only reach the final state q3 if it reads exactly 'a', then 'b', then 'a'. Any other sequence of inputs leads to the trap state, from which it cannot escape.",
// //         },
// //     },
// //     "nfa-generator": {
// //         title: "NFA from Regular Expression",
// //         overview: "A Non-deterministic Finite Automaton (NFA) is more flexible than a DFA. From a single state, it can transition to multiple states on the same input symbol. It can also have ε-transitions, which allow it to change state without consuming any input. An NFA accepts an input string if at least one possible path of transitions ends in a final state. This tool builds an NFA from a regular expression using Thompson's Construction.",
// //         steps: [
// //             "1. Base Cases: For an empty string (ε), create a start and end state with an ε-transition. For a symbol 'a', create a start and end state with an 'a' transition.",
// //             "2. Concatenation (ab): The final state of the NFA for 'a' becomes the initial state of the NFA for 'b'.",
// //             "3. Union (a|b): Create a new start state with ε-transitions to the start states of the NFAs for 'a' and 'b'. Create a new final state, and add ε-transitions from the final states of 'a' and 'b' to this new final state.",
// //             "4. Kleene Star (a*): Create new start and final states. Add ε-transitions: from the new start to the old start, from the old final to the new final, from the old final back to the old start (for loops), and from the new start directly to the new final (to allow skipping)."
// //         ],
// //         example: {
// //             problem: "Construct an NFA for the regular expression (a|b)*a.",
// //             solutionSteps: [
// //                 "Build for 'a' and 'b': Create simple two-state NFAs for 'a' and 'b'.",
// //                 "Combine for 'a|b': Use the union rule to create an NFA that accepts 'a' or 'b'.",
// //                 "Apply Kleene Star for (a|b)*: Use the star rule on the 'a|b' NFA to allow zero or more repetitions.",
// //                 "Concatenate with 'a': Connect the NFA for (a|b)* to a new NFA for 'a' using the concatenation rule."
// //             ],
// //             final: "The resulting NFA will non-deterministically follow paths for any sequence of 'a's and 'b's, and will only reach the final state if the entire string ends with an 'a'.",
// //         },
// //     },
// //     "nfa-to-dfa": {
// //         title: "NFA → DFA (Subset Construction)",
// //         overview: "Since every NFA has an equivalent DFA, we can convert between them. The process, called Subset Construction, creates a DFA where each state corresponds to a *set* of states from the NFA. A DFA state is final if it contains any of the NFA's final states.",
// //         steps: [
// //             "1. Initialize: The start state of the DFA is the ε-closure of the NFA's start state. (The ε-closure is the set of all states reachable from a state using only ε-transitions).",
// //             "2. Iterate and Build: Create a worklist with the DFA's start state. While the worklist is not empty, pop a state (which is a set of NFA states).",
// //             "3. Compute Transitions: For the current DFA state (e.g., S) and for each symbol in the alphabet, calculate the set of states reachable from any state in S on that symbol. The ε-closure of this new set forms a new DFA state.",
// //             "4. Add New States: If this new DFA state hasn't been seen before, add it to the DFA and to the worklist.",
// //             "5. Repeat: Continue until the worklist is empty and no new states can be created."
// //         ],
// //         example: {
// //             problem: "Convert an NFA with states {q0, q1}, start q0, final {q1}. Transitions: δ(q0, a)={q0, q1}, δ(q0, b)={q1}.",
// //             solutionSteps: [
// //                 "DFA Start State: The start state is ε-closure({q0}) = {q0}. Let's call this DFA state A.",
// //                 "From A on 'a': move(A, a) = move({q0}, a) = {q0, q1}. Let's call this new DFA state B.",
// //                 "From A on 'b': move(A, b) = move({q0}, b) = {q1}. Let's call this new DFA state C.",
// //                 "From B on 'a': move(B, a) = move({q0, q1}, a) = {q0, q1} = B.",
// //                 "From B on 'b': move(B, b) = move({q0, q1}, b) = {q1} = C.",
// //                 "Final States: Any DFA state containing the NFA final state 'q1' becomes final. So, B={q0,q1} and C={q1} are final states."
// //             ],
// //             final: "The resulting DFA has states A={q0}, B={q0,q1}, and C={q1}, with B and C as final states.",
// //         },
// //     },
// //     "ll1-parser": {
// //         title: "LL(1) Parser Generator",
// //         overview: "An LL(1) parser is a top-down parser for a subset of context-free grammars. It's called LL(1) because it parses the input from Left to right, constructs a Leftmost derivation, using 1 lookahead symbol. It relies on a parsing table to guide its decisions. For a grammar to be LL(1), it must not be ambiguous or left-recursive.",
// //         steps: [
// //             "1. Check Grammar: Ensure the grammar is not left-recursive. If it is, it must be converted.",
// //             "2. Compute FIRST sets: For each grammar symbol X, FIRST(X) is the set of terminals that can begin a string derived from X. If X can derive ε, then ε is in FIRST(X).",
// //             "3. Compute FOLLOW sets: For each non-terminal A, FOLLOW(A) is the set of terminals that can appear immediately to the right of A in some sentential form. '$' (end of input) is in the FOLLOW set of the start symbol.",
// //             "4. Construct the Parse Table: For each production A -> α:",
// //             "  a) For each terminal 't' in FIRST(α), add the production A -> α to table entry M[A, t].",
// //             "  b) If ε is in FIRST(α), then for each terminal 't' in FOLLOW(A), add A -> α to M[A, t]."
// //         ],
// //         example: {
// //             problem: "For the grammar:\nE -> T E'\nE' -> + T E' | ε\nT -> F T'\nT' -> * F T' | ε\nF -> ( E ) | id",
// //             solutionSteps: [
// //                 "FIRST(E) = FIRST(T) = FIRST(F) = { '(', 'id' }",
// //                 "FOLLOW(E) = { '$', ')' }",
// //                 "FOLLOW(E') = FOLLOW(E) = { '$', ')' }",
// //                 "Table Entry [E', +]: FIRST(+ T E') = { '+' }. So, add `E' -> + T E'` to the table at row E', column +.",
// //                 "Table Entry [E', )]: FIRST(ε) = { ε }. Since ε is in the first set, we look at FOLLOW(E'). FOLLOW(E') contains ')'. So, add `E' -> ε` to the table at row E', column ).",
// //             ],
// //             final: "The completed table guides the parser. When the parser is considering non-terminal E' and sees the input '+', it knows to apply the rule E' -> + T E'. If it sees ')' or '$', it applies E' -> ε.",
// //         },
// //     },
// //     "lr-parser": {
// //         title: "SLR(1) Parser Generator",
// //         overview: "An SLR(1) parser is a bottom-up parser that is more powerful than an LL(1) parser. It reads input from Left to right and produces a Rightmost derivation in reverse. It's called SLR (Simple LR) because it uses a simple method for constructing the parsing table. It works by shifting tokens onto a stack and reducing them when the top of the stack matches a grammar rule.",
// //         steps: [
// //             "1. Augment the Grammar: Add a new start symbol S' and a production S' -> S, where S was the original start symbol.",
// //             "2. Create LR(0) Items: An LR(0) item is a production with a dot '.' somewhere on the right-hand side. The dot indicates how much of the production has been seen.",
// //             "3. Compute Closure: The closure of a set of items is found by repeatedly adding new items if the dot is before a non-terminal. For a non-terminal B, all productions starting with B are added with the dot at the beginning.",
// //             "4. Compute Goto: The Goto function defines the transitions between sets of items (states). Goto(I, X) is the closure of all items where the dot has been moved over the symbol X.",
// //             "5. Build the Parsing Table: The collection of item sets forms the states of the automaton. The table has two parts: ACTION and GOTO. Shift actions are determined by Goto transitions on terminals. Reduce actions for a production A -> α are placed in the row for a state if it contains the item [A -> α.] and the next input symbol is in FOLLOW(A)."
// //         ],
// //         example: {
// //             problem: "For the grammar S -> a S b | c",
// //             solutionSteps: [
// //                 "1. Augment: S' -> S",
// //                 "2. Initial State (I₀): Closure of [S' -> .S] gives the set { [S' -> .S], [S -> .a S b], [S -> .c] }.",
// //                 "3. Compute Transitions: Goto(I₀, a) will create a new state containing [S -> a .S b] and its closure. Goto(I₀, c) will create a state with [S -> c.].",
// //                 "4. Build Table: In state I₀, on input 'a', the table will say 'Shift' to the new state. On input 'c', it will say 'Shift'.",
// //                 "5. Reduce Action: In the state containing [S -> c.], the parser has seen the full rule. For any terminal 't' in FOLLOW(S), the table action will be 'Reduce using S -> c'."
// //             ],
// //             final: "The SLR table uses the FOLLOW set to decide when to reduce, which avoids some conflicts. If a state contains both a shift and a reduce possibility for the same terminal, it's a shift-reduce conflict, and the grammar isn't SLR(1).",
// //         },
// //     },
// // };

// /* -------------------- Topic Data (ENRICHED WITH FORMAL DEFINITIONS) -------------------- */
// const TOPICS = {
//     "dfa-generator": {
//         title: "DFA: Deterministic Finite Automaton",
//         overview: `A Deterministic Finite Automaton (DFA) is a 5-tuple: $$ (Q, \\Sigma, \\delta, q_0, F) $$ Where:
//         <ul>
//             <li><b>Q:</b> A finite set of states</li>
//             <li><b>Σ (Sigma):</b> A finite set of input symbols (the alphabet)</li>
//             <li><b>δ (delta):</b> The transition function, where δ: Q × Σ → Q</li>
//             <li><b>q₀:</b> The initial state (q₀ ∈ Q)</li>
//             <li><b>F:</b> A set of accepting (final) states (F ⊆ Q)</li>
//         </ul>
//         <b>Key properties:</b> For each state and input symbol, there is exactly one transition. No ε (epsilon) or null transitions are allowed.`,
//         steps: [
//             "1. Start at the initial state q₀.",
//             "2. Read the input string one symbol at a time from left to right.",
//             "3. For each symbol, use the transition function δ to move from the current state to the next state.",
//             "4. After the last symbol has been processed, check the current state.",
//             "5. If the current state is in the set of final states F, the string is <b>accepted</b>.",
//             "6. Otherwise, the string is <b>rejected</b>."
//         ],
//         example: {
//             problem: `Design a DFA that accepts all binary strings ending with "01".`,
//             solutionSteps: [
//                 "Q = {q0, q1, q2}",
//                 "Σ = {0, 1}",
//                 "q₀ = q0 (start state)",
//                 "F = {q2} (final state)",
//                 `The transition function δ is defined as:
//                 <table class="table table-sm table-bordered mt-2">
//                     <thead><tr><th>Current State</th><th>Input</th><th>Next State</th></tr></thead>
//                     <tbody>
//                         <tr><td>q0</td><td>0</td><td>q1</td></tr>
//                         <tr><td>q0</td><td>1</td><td>q0</td></tr>
//                         <tr><td>q1</td><td>0</td><td>q1</td></tr>
//                         <tr><td>q1</td><td>1</td><td>q2</td></tr>
//                         <tr><td>q2</td><td>0</td><td>q1</td></tr>
//                         <tr><td>q2</td><td>1</td><td>q0</td></tr>
//                     </tbody>
//                 </table>`,
//                 "<b>Test String '1101':</b> q0 → q0 (on 1) → q0 (on 1) → q1 (on 0) → q2 (on 1). The final state is q2, so the string is ✅ Accepted."
//             ],
//             final: `
//             <pre class="p-3 bg-light rounded mt-2 text-center" style="font-size: 0.9rem; line-height: 1.5;">
//     1         0
//    / \\       / \\
//   /   \\     /   \\
//   V   /     V   /
// (q0) --0--> (q1) --1--> ((q2))
//   ^           ^         |
//   |           |         |
//   \\-----1-----/         |
//    \\----------0---------/
//             </pre>
//             <b>Explanation:</b> The automaton stays in q0 as long as it sees 1s. When a 0 appears, it moves to q1, hoping for a 1. If it gets the 1, it moves to the final state q2. If it gets another 0, it stays in q1, resetting the "01" pattern. From the final state q2, any new input will move it out of the accepting state.`,
//         },
//     },
//     "nfa-generator": {
//         title: "NFA from Regular Expression",
//         overview: "A Non-deterministic Finite Automaton (NFA) is more flexible than a DFA. From a single state, it can transition to multiple states on the same input symbol. It can also have ε-transitions, which allow it to change state without consuming any input. An NFA accepts an input string if at least one possible path of transitions ends in a final state. This tool builds an NFA from a regular expression using Thompson's Construction.",
//         steps: [
//             "1. Base Cases: For an empty string (ε), create a start and end state with an ε-transition. For a symbol 'a', create a start and end state with an 'a' transition.",
//             "2. Concatenation (ab): The final state of the NFA for 'a' becomes the initial state of the NFA for 'b'.",
//             "3. Union (a|b): Create a new start state with ε-transitions to the start states of the NFAs for 'a' and 'b'. Create a new final state, and add ε-transitions from the final states of 'a' and 'b' to this new final state.",
//             "4. Kleene Star (a*): Create new start and final states. Add ε-transitions: from the new start to the old start, from the old final to the new final, from the old final back to the old start (for loops), and from the new start directly to the new final (to allow skipping)."
//         ],
//         example: {
//             problem: "Construct an NFA for the regular expression (a|b)*a.",
//             solutionSteps: [
//                 "Build for 'a' and 'b': Create simple two-state NFAs for 'a' and 'b'.",
//                 "Combine for 'a|b': Use the union rule to create an NFA that accepts 'a' or 'b'.",
//                 "Apply Kleene Star for (a|b)*: Use the star rule on the 'a|b' NFA to allow zero or more repetitions.",
//                 "Concatenate with 'a': Connect the NFA for (a|b)* to a new NFA for 'a' using the concatenation rule."
//             ],
//             final: "The resulting NFA will non-deterministically follow paths for any sequence of 'a's and 'b's, and will only reach the final state if the entire string ends with an 'a'.",
//         },
//     },
//     "nfa-to-dfa": {
//         title: "NFA → DFA (Subset Construction)",
//         overview: "Since every NFA has an equivalent DFA, we can convert between them. The process, called Subset Construction, creates a DFA where each state corresponds to a *set* of states from the NFA. A DFA state is final if it contains any of the NFA's final states.",
//         steps: [
//             "1. Initialize: The start state of the DFA is the ε-closure of the NFA's start state. (The ε-closure is the set of all states reachable from a state using only ε-transitions).",
//             "2. Iterate and Build: Create a worklist with the DFA's start state. While the worklist is not empty, pop a state (which is a set of NFA states).",
//             "3. Compute Transitions: For the current DFA state (e.g., S) and for each symbol in the alphabet, calculate the set of states reachable from any state in S on that symbol. The ε-closure of this new set forms a new DFA state.",
//             "4. Add New States: If this new DFA state hasn't been seen before, add it to the DFA and to the worklist.",
//             "5. Repeat: Continue until the worklist is empty and no new states can be created."
//         ],
//         example: {
//             problem: "Convert an NFA with states {q0, q1}, start q0, final {q1}. Transitions: δ(q0, a)={q0, q1}, δ(q0, b)={q1}.",
//             solutionSteps: [
//                 "DFA Start State: The start state is ε-closure({q0}) = {q0}. Let's call this DFA state A.",
//                 "From A on 'a': move(A, a) = move({q0}, a) = {q0, q1}. Let's call this new DFA state B.",
//                 "From A on 'b': move(A, b) = move({q0}, b) = {q1}. Let's call this new DFA state C.",
//                 "From B on 'a': move(B, a) = move({q0, q1}, a) = {q0, q1} = B.",
//                 "From B on 'b': move(B, b) = move({q0, q1}, b) = {q1} = C.",
//                 "Final States: Any DFA state containing the NFA final state 'q1' becomes final. So, B={q0,q1} and C={q1} are final states."
//             ],
//             final: "The resulting DFA has states A={q0}, B={q0,q1}, and C={q1}, with B and C as final states.",
//         },
//     },
//     "ll1-parser": {
//         title: "LL(1) Parser Generator",
//         overview: "An LL(1) parser is a top-down parser for a subset of context-free grammars. It's called LL(1) because it parses the input from Left to right, constructs a Leftmost derivation, using 1 lookahead symbol. It relies on a parsing table to guide its decisions. For a grammar to be LL(1), it must not be ambiguous or left-recursive.",
//         steps: [
//             "1. Check Grammar: Ensure the grammar is not left-recursive. If it is, it must be converted.",
//             "2. Compute FIRST sets: For each grammar symbol X, FIRST(X) is the set of terminals that can begin a string derived from X. If X can derive ε, then ε is in FIRST(X).",
//             "3. Compute FOLLOW sets: For each non-terminal A, FOLLOW(A) is the set of terminals that can appear immediately to the right of A in some sentential form. '$' (end of input) is in the FOLLOW set of the start symbol.",
//             "4. Construct the Parse Table: For each production A -> α:",
//             "  a) For each terminal 't' in FIRST(α), add the production A -> α to table entry M[A, t].",
//             "  b) If ε is in FIRST(α), then for each terminal 't' in FOLLOW(A), add A -> α to M[A, t]."
//         ],
//         example: {
//             problem: "For the grammar:\nE -> T E'\nE' -> + T E' | ε\nT -> F T'\nT' -> * F T' | ε\nF -> ( E ) | id",
//             solutionSteps: [
//                 "FIRST(E) = FIRST(T) = FIRST(F) = { '(', 'id' }",
//                 "FOLLOW(E) = { '$', ')' }",
//                 "FOLLOW(E') = FOLLOW(E) = { '$', ')' }",
//                 "Table Entry [E', +]: FIRST(+ T E') = { '+' }. So, add `E' -> + T E'` to the table at row E', column +.",
//                 "Table Entry [E', )]: FIRST(ε) = { ε }. Since ε is in the first set, we look at FOLLOW(E'). FOLLOW(E') contains ')'. So, add `E' -> ε` to the table at row E', column ).",
//             ],
//             final: "The completed table guides the parser. When the parser is considering non-terminal E' and sees the input '+', it knows to apply the rule E' -> + T E'. If it sees ')' or '$', it applies E' -> ε.",
//         },
//     },
//     "lr-parser": {
//         title: "SLR(1) Parser Generator",
//         overview: "An SLR(1) parser is a bottom-up parser that is more powerful than an LL(1) parser. It reads input from Left to right and produces a Rightmost derivation in reverse. It's called SLR (Simple LR) because it uses a simple method for constructing the parsing table. It works by shifting tokens onto a stack and reducing them when the top of the stack matches a grammar rule.",
//         steps: [
//             "1. Augment the Grammar: Add a new start symbol S' and a production S' -> S, where S was the original start symbol.",
//             "2. Create LR(0) Items: An LR(0) item is a production with a dot '.' somewhere on the right-hand side. The dot indicates how much of the production has been seen.",
//             "3. Compute Closure: The closure of a set of items is found by repeatedly adding new items if the dot is before a non-terminal. For a non-terminal B, all productions starting with B are added with the dot at the beginning.",
//             "4. Compute Goto: The Goto function defines the transitions between sets of items (states). Goto(I, X) is the closure of all items where the dot has been moved over the symbol X.",
//             "5. Build the Parsing Table: The collection of item sets forms the states of the automaton. The table has two parts: ACTION and GOTO. Shift actions are determined by Goto transitions on terminals. Reduce actions for a production A -> α are placed in the row for a state if it contains the item [A -> α.] and the next input symbol is in FOLLOW(A)."
//         ],
//         example: {
//             problem: "For the grammar S -> a S b | c",
//             solutionSteps: [
//                 "1. Augment: S' -> S",
//                 "2. Initial State (I₀): Closure of [S' -> .S] gives the set { [S' -> .S], [S -> .a S b], [S -> .c] }.",
//                 "3. Compute Transitions: Goto(I₀, a) will create a new state containing [S -> a .S b] and its closure. Goto(I₀, c) will create a state with [S -> c.].",
//                 "4. Build Table: In state I₀, on input 'a', the table will say 'Shift' to the new state. On input 'c', it will say 'Shift'.",
//                 "5. Reduce Action: In the state containing [S -> c.], the parser has seen the full rule. For any terminal 't' in FOLLOW(S), the table action will be 'Reduce using S -> c'."
//             ],
//             final: "The SLR table uses the FOLLOW set to decide when to reduce, which avoids some conflicts. If a state contains both a shift and a reduce possibility for the same terminal, it's a shift-reduce conflict, and the grammar isn't SLR(1).",
//         },
//     },
// };
// /* -------------------- Main App Component -------------------- */
// function App() {
//     const [activeTool, setActiveTool] = useState("welcome");

//     const renderContent = () => {
//         switch (activeTool) {
//             case "dfa-generator": return <DfaGeneratorTool />;
//             case "nfa-generator": return <NfaGeneratorTool />;
//             case "nfa-to-dfa": return <NfaToDfaTool />;
//             case "ll1-parser": return <Ll1ParserTool />;
//             case "lr-parser": return <LrParserTool />;
//             default: return <WelcomeContent />;
//         }
//     };

//     return (
//         <>
//             <Header />
//             <div className="container-fluid">
//                 <div className="row">
//                     <Sidebar setActiveTool={setActiveTool} />
//                     <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main-content">
//                         {renderContent()}
//                     </main>
//                 </div>
//             </div>
//         </>
//     );
// }

// /* -------------------- Reusable UI Components -------------------- */
// const Header = () => (
//     <header className="navbar navbar-dark sticky-top shadow-sm custom-navbar">
//         <a className="navbar-brand col-md-3 col-lg-2 me-0 px-3 fs-6" href="#">
//             <i className="bi bi-diagram-3-fill me-2"></i> Automata & Compiler Lab
//         </a>
//     </header>
// );

// const Sidebar = ({ setActiveTool }) => {
//     const [active, setActive] = useState("welcome");

//     const handleClick = (tool) => {
//         setActive(tool);
//         setActiveTool(tool);
//     };

//     return (
//         <nav id="sidebarMenu" className="col-md-3 col-lg-2 d-md-block sidebar collapse">
//             <div className="position-sticky pt-3 sidebar-sticky">
//                 <ul className="nav flex-column">
//                     <li className="nav-item">
//                         <a href="#" className={`nav-link ${active === "welcome" ? "active" : ""}`} onClick={() => handleClick("welcome")}>
//                             <i className="bi bi-house-door-fill me-2"></i> Home
//                         </a>
//                     </li>
//                     <li className="nav-item">
//                         <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#fa-submenu">
//                             <i className="bi bi-gear-wide-connected me-2"></i> Finite Automata
//                         </a>
//                         <div className="collapse show" id="fa-submenu">
//                             <ul className="nav flex-column ms-3">
//                                 <li className="nav-item">
//                                     <a href="#" className={`nav-link ${active === "dfa-generator" ? "active" : ""}`} onClick={() => handleClick("dfa-generator")}>DFA Generator</a>
//                                 </li>
//                                 <li className="nav-item">
//                                     <a href="#" className={`nav-link ${active === "nfa-generator" ? "active" : ""}`} onClick={() => handleClick("nfa-generator")}>NFA Generator</a>
//                                 </li>
//                                 <li className="nav-item">
//                                     <a href="#" className={`nav-link ${active === "nfa-to-dfa" ? "active" : ""}`} onClick={() => handleClick("nfa-to-dfa")}>NFA to DFA</a>
//                                 </li>
//                             </ul>
//                         </div>
//                     </li>
//                     <li className="nav-item">
//                          <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="collapse" data-bs-target="#parser-submenu">
//                             <i className="bi bi-file-earmark-code me-2"></i> Parsers
//                         </a>
//                         <div className="collapse show" id="parser-submenu">
//                              <ul className="nav flex-column ms-3">
//                                 <li className="nav-item">
//                                     <a href="#" className={`nav-link ${active === "ll1-parser" ? "active" : ""}`} onClick={() => handleClick("ll1-parser")}>LL(1) Parser</a>
//                                 </li>
//                                 <li className="nav-item">
//                                     <a href="#" className={`nav-link ${active === "lr-parser" ? "active" : ""}`} onClick={() => handleClick("lr-parser")}>SLR(1) Parser</a>
//                                 </li>
//                              </ul>
//                         </div>
//                     </li>
//                 </ul>
//             </div>
//         </nav>
//     );
// };


// const WelcomeContent = () => (
//     <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
//         <div className="welcome-card text-center shadow-sm">
//             <h1 className="display-5 mb-3">Welcome to the Lab</h1>
//             <p className="lead text-muted">Select a tool from the sidebar to begin exploring automata and compiler design concepts.</p>
//             <i className="bi bi-box-arrow-in-left display-1 mt-3 text-primary"></i>
//         </div>
//     </div>
// );

// const TopicInfoPanel = ({ topicKey }) => {
//     const topic = TOPICS[topicKey];
//     return (
//         <div className="card info-card mb-4">
//             <div className="card-body">
//                 <h5 className="card-title"><i className="bi bi-info-circle me-2"></i>How it Works</h5>
//                 <p className="card-text">{topic.overview}</p>
//                 <div className="accordion mt-4" id={`accordion-${topicKey}`}>
//                     <div className="accordion-item">
//                         <h2 className="accordion-header">
//                             <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-steps-${topicKey}`}>Step-by-step Process</button>
//                         </h2>
//                         <div id={`collapse-steps-${topicKey}`} className="accordion-collapse collapse" data-bs-parent={`#accordion-${topicKey}`}>
//                             <div className="accordion-body topic-steps">
//                                 <ol>{topic.steps.map((s, i) => <li key={i} className="mb-2">{s}</li>)}</ol>
//                             </div>
//                         </div>
//                     </div>
//                     <div className="accordion-item">
//                         <h2 className="accordion-header">
//                             <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-example-${topicKey}`}>Worked Example</button>
//                         </h2>
//                         <div id={`collapse-example-${topicKey}`} className="accordion-collapse collapse" data-bs-parent={`#accordion-${topicKey}`}>
//                             <div className="accordion-body solution-card">
//                                 <h6 className="fw-semibold">Problem</h6>
//                                 <p className="mb-3">{topic.example.problem}</p>
//                                 <h6 className="fw-semibold">Solution — steps</h6>
//                                 <ol>{topic.example.solutionSteps.map((ss, idx) => <li key={idx} className="mb-2">{ss}</li>)}</ol>
//                                 <div className="mt-3">
//                                     <h6 className="fw-semibold">Final / Result</h6>
//                                     <pre className="p-3 bg-light rounded">{topic.example.final}</pre>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// const DfaResultsDisplay = ({ results }) => (
//     <div className="card results-card">
//         <div className="card-header fw-bold">Results: Transition Table</div>
//         <div className="card-body">
//             <div className="table-responsive mb-3">
//                 <table className="table table-bordered text-center">
//                     <thead>
//                         <tr>
//                             <th>State</th>
//                             {results.dfa.alphabet.map((c) => <th key={c}>{c}</th>)}
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {results.dfa.states.map((state) => (
//                             <tr key={state}>
//                                 <td className="fw-medium">
//                                     {state === results.dfa.start_state && "➡️ "}
//                                     {results.dfa.final_states.includes(state) && "*"}
//                                     {state}
//                                 </td>
//                                 {results.dfa.alphabet.map((symbol) => (
//                                     <td key={symbol}>{results.dfa.transitions[`${state},${symbol}`] || "—"}</td>
//                                 ))}
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//             <div className="text-center">
//                 <img src={results.graph_image} alt="DFA Graph" className="img-fluid rounded border" />
//             </div>
//         </div>
//     </div>
// );

// /* -------------------- Tool Implementations -------------------- */
// const ToolWrapper = ({ topicKey, children }) => (
//     <>
//         <div className="section-header"><h1 className="h2">{TOPICS[topicKey].title}</h1></div>
//         <div className="row g-4 justify-content-center">
//             <div className="col-lg-12"><TopicInfoPanel topicKey={topicKey} /></div>
//             <div className="col-lg-10 col-md-12">{children}</div>
//         </div>
//     </>
// );

// // Generic fetch handler for all tools
// const handleApiSubmit = async (endpoint, body, setResults, setError, setIsLoading) => {
//     setResults(null);
//     setError("");
//     setIsLoading(true);
//     try {
//         const response = await fetch(`http://127.0.0.1:8000/api/${endpoint}/`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(body),
//         });
//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
//         }
//         const data = await response.json();
//         setResults(data);
//     } catch (err) {
//         setError(err.message);
//     } finally {
//         setIsLoading(false);
//     }
// };

// const DfaGeneratorTool = () => {
//     const [alphabet, setAlphabet] = useState("ab");
//     const [acceptString, setAcceptString] = useState("aba");
//     const [results, setResults] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         if (![...acceptString].every((char) => alphabet.includes(char))) {
//             setError(`Error: The string '${acceptString}' contains characters not in the alphabet '${alphabet}'.`);
//             return;
//         }
//         handleApiSubmit("generate-dfa", { alphabet, accept_string: acceptString }, setResults, setError, setIsLoading);
//     };

//     return (
//         <ToolWrapper topicKey="dfa-generator">
//             <div className="card form-card mb-4">
//                 <div className="card-body">
//                     <h5 className="card-title"><i className="bi bi-play-circle me-2"></i>Generate DFA</h5>
//                     <form onSubmit={handleSubmit} className="mt-3">
//                         <div className="mb-3">
//                             <label htmlFor="alphabet" className="form-label">Alphabet (e.g., ab01)</label>
//                             <input type="text" id="alphabet" value={alphabet} onChange={(e) => setAlphabet(e.target.value)} className="form-control" />
//                         </div>
//                         <div className="mb-3">
//                             <label htmlFor="accept_string" className="form-label">String to Accept</label>
//                             <input type="text" id="accept_string" value={acceptString} onChange={(e) => setAcceptString(e.target.value)} className="form-control" />
//                         </div>
//                         <button type="submit" disabled={isLoading} className="btn btn-primary w-100">
//                             {isLoading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>) : "Generate DFA"}
//                         </button>
//                     </form>
//                     {error && <div className="alert alert-danger mt-3">{error}</div>}
//                 </div>
//             </div>
//             {results && <DfaResultsDisplay results={results} />}
//         </ToolWrapper>
//     );
// };

// const NfaGeneratorTool = () => {
//     const [regex, setRegex] = useState("(a|b)*a");
//     const [results, setResults] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         handleApiSubmit("generate-nfa", { regex }, setResults, setError, setIsLoading);
//     };

//     return (
//         <ToolWrapper topicKey="nfa-generator">
//             <div className="card form-card mb-4">
//                 <div className="card-body">
//                     <h5 className="card-title"><i className="bi bi-play-circle me-2"></i>Generate NFA from Regular Expression</h5>
//                     <form onSubmit={handleSubmit}>
//                         <div className="mb-3">
//                             <label htmlFor="regex" className="form-label">Regular Expression</label>
//                             <input type="text" id="regex" value={regex} onChange={(e) => setRegex(e.target.value)} className="form-control" />
//                         </div>
//                         <button type="submit" disabled={isLoading} className="btn btn-primary w-100">
//                             {isLoading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>) : "Generate NFA"}
//                         </button>
//                     </form>
//                     {error && <div className="alert alert-danger mt-3">{error}</div>}
//                 </div>
//             </div>
//             {results && (
//                 <div className="card results-card">
//                     <div className="card-header fw-bold">Generated NFA</div>
//                     <div className="card-body text-center">
//                          <img src={results.graph_image} alt="NFA Graph" className="img-fluid rounded border" />
//                     </div>
//                 </div>
//             )}
//         </ToolWrapper>
//     );
// };

// const NfaToDfaTool = () => {
//     const [nfaDefinition, setNfaDefinition] = useState(JSON.stringify({
//         states: ["q0", "q1", "q2"],
//         alphabet: ["a", "b"],
//         transitions: {
//             "q0": { "a": ["q0", "q1"], "b": ["q0"] },
//             "q1": { "b": ["q2"] }
//         },
//         start_state: "q0",
//         final_states: ["q2"]
//     }, null, 2));
//     const [results, setResults] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         try {
//             const nfaData = JSON.parse(nfaDefinition);
//             handleApiSubmit("nfa-to-dfa", { nfa: nfaData }, setResults, setError, setIsLoading);
//         } catch (err) {
//             setError("Invalid JSON format for NFA definition.");
//         }
//     };

//     return (
//         <ToolWrapper topicKey="nfa-to-dfa">
//             <div className="card form-card mb-4">
//                 <div className="card-body">
//                     <h5 className="card-title"><i className="bi bi-play-circle me-2"></i>Convert NFA to DFA</h5>
//                     <form onSubmit={handleSubmit}>
//                         <div className="mb-3">
//                             <label htmlFor="nfa-def" className="form-label">NFA Definition (JSON)</label>
//                             <textarea id="nfa-def" value={nfaDefinition} onChange={(e) => setNfaDefinition(e.target.value)} className="form-control" rows="12"></textarea>
//                         </div>
//                         <button type="submit" disabled={isLoading} className="btn btn-primary w-100">
//                             {isLoading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Converting...</>) : "Convert"}
//                         </button>
//                     </form>
//                     {error && <div className="alert alert-danger mt-3">{error}</div>}
//                 </div>
//             </div>
//             {results && <DfaResultsDisplay results={results} />}
//         </ToolWrapper>
//     );
// };

// const Ll1ParserTool = () => {
//     const [grammar, setGrammar] = useState("E -> T E_prime\nE_prime -> + T E_prime | epsilon\nT -> F T_prime\nT_prime -> * F T_prime | epsilon\nF -> ( E ) | id");
//     const [results, setResults] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         handleApiSubmit("ll1-parser", { grammar }, setResults, setError, setIsLoading);
//     };

//     return (
//         <ToolWrapper topicKey="ll1-parser">
//             <div className="card form-card mb-4">
//                 <div className="card-body">
//                     <h5 className="card-title"><i className="bi bi-play-circle me-2"></i>Generate LL(1) Parse Table</h5>
//                     <form onSubmit={handleSubmit}>
//                         <div className="mb-3">
//                             <label htmlFor="grammar-ll1" className="form-label">Grammar (one rule per line, use 'epsilon')</label>
//                             <textarea id="grammar-ll1" value={grammar} onChange={(e) => setGrammar(e.target.value)} className="form-control" rows="8"></textarea>
//                         </div>
//                         <button type="submit" disabled={isLoading} className="btn btn-primary w-100">
//                             {isLoading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>) : "Generate Table"}
//                         </button>
//                     </form>
//                     {error && <div className="alert alert-danger mt-3">{error}</div>}
//                 </div>
//             </div>
//             {results && (
//                 <div className="card results-card">
//                     <div className="card-header fw-bold">LL(1) Results</div>
//                     <div className="card-body">
//                         <div className="row">
//                             <div className="col-md-6">
//                                 <h6 className="fw-semibold">FIRST Sets</h6>
//                                 <pre className="p-2 bg-light rounded">{JSON.stringify(results.first_sets, null, 2)}</pre>
//                             </div>
//                             <div className="col-md-6">
//                                 <h6 className="fw-semibold">FOLLOW Sets</h6>
//                                 <pre className="p-2 bg-light rounded">{JSON.stringify(results.follow_sets, null, 2)}</pre>
//                             </div>
//                         </div>
//                         <h6 className="fw-semibold mt-4">Parse Table</h6>
//                         <div className="table-responsive">
//                             <table className="table table-bordered parse-table">
//                                 {/* Render Table Header */}
//                                 <thead><tr><th>Non-Terminal</th>{Object.keys(results.first_sets).flatMap(k => results.first_sets[k]).filter(t => t !== 'epsilon').concat('$').filter((v, i, a) => a.indexOf(v) === i).sort().map(t => <th key={t}>{t}</th>)}</tr></thead>
//                                 <tbody>
//                                     {Object.keys(results.parse_table).sort().map(nt => (
//                                         <tr key={nt}>
//                                             <td className="fw-bold">{nt}</td>
//                                             {Object.keys(results.first_sets).flatMap(k => results.first_sets[k]).filter(t => t !== 'epsilon').concat('$').filter((v, i, a) => a.indexOf(v) === i).sort().map(t => (
//                                                 <td key={t}>{results.parse_table[nt][t] || ''}</td>
//                                             ))}
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </ToolWrapper>
//     );
// };

// const LrParserTool = () => {
//     const [grammar, setGrammar] = useState("S -> a S b | epsilon");
//     const [results, setResults] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         handleApiSubmit("slr-parser", { grammar }, setResults, setError, setIsLoading);
//     };

//     const terminals = results ? [...new Set(Object.values(results.parse_table.action).flatMap(Object.keys))].sort() : [];
//     const nonTerminals = results ? [...new Set(Object.values(results.parse_table.goto).flatMap(Object.keys))].sort() : [];

//     return (
//         <ToolWrapper topicKey="lr-parser">
//             <div className="card form-card mb-4">
//                 <div className="card-body">
//                     <h5 className="card-title"><i className="bi bi-play-circle me-2"></i>Generate SLR(1) Parse Table</h5>
//                     <form onSubmit={handleSubmit}>
//                         <div className="mb-3">
//                             <label htmlFor="grammar-lr" className="form-label">Grammar (one rule per line, use 'epsilon')</label>
//                             <textarea id="grammar-lr" value={grammar} onChange={(e) => setGrammar(e.target.value)} className="form-control" rows="6"></textarea>
//                         </div>
//                         <button type="submit" disabled={isLoading} className="btn btn-primary w-100">
//                             {isLoading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>) : "Generate Table"}
//                         </button>
//                     </form>
//                     {error && <div className="alert alert-danger mt-3">{error}</div>}
//                 </div>
//             </div>
//             {results && (
//                 <div className="card results-card">
//                     <div className="card-header fw-bold">SLR(1) Results</div>
//                     <div className="card-body">
//                         <h6 className="fw-semibold">Productions</h6>
//                         <ol start="0">
//                             {results.productions.map((p, i) => <li key={i}>{p}</li>)}
//                         </ol>
                        
//                         <h6 className="fw-semibold mt-4">Canonical LR(0) Item Sets (States)</h6>
//                         <pre className="p-2 bg-light rounded">{JSON.stringify(results.item_sets, null, 2)}</pre>
                       
//                         <h6 className="fw-semibold mt-4">SLR(1) ACTION/GOTO Table</h6>
//                         <div className="table-responsive">
//                             <table className="table table-bordered parse-table">
//                                 <thead>
//                                     <tr>
//                                         <th rowSpan="2">State</th>
//                                         <th colSpan={terminals.length}>ACTION</th>
//                                         <th colSpan={nonTerminals.length}>GOTO</th>
//                                     </tr>
//                                     <tr>
//                                         {terminals.map(t => <th key={t}>{t}</th>)}
//                                         {nonTerminals.map(nt => <th key={nt}>{nt}</th>)}
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {Object.keys(results.item_sets).map(stateKey => {
//                                         const stateNum = stateKey.substring(1);
//                                         return (
//                                             <tr key={stateKey}>
//                                                 <td className="fw-bold">{stateNum}</td>
//                                                 {terminals.map(t => {
//                                                     const action = results.parse_table.action[stateNum]?.[t] || '';
//                                                     const className = action.startsWith('S') ? 'action-shift' : action.startsWith('R') ? 'action-reduce' : action === 'Accept' ? 'action-accept' : '';
//                                                     return <td key={t} className={className}>{action}</td>
//                                                 })}
//                                                 {nonTerminals.map(nt => <td key={nt}>{results.parse_table.goto[stateNum]?.[nt] || ''}</td>)}
//                                             </tr>
//                                         )
//                                     })}
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </ToolWrapper>
//     );
// };

// export default App;










