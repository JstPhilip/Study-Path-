import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google GenAI on the server
const aiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (aiApiKey) {
  ai = new GoogleGenAI({
    apiKey: aiApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("Warning: GEMINI_API_KEY is not defined. Using adaptive simulation mode.");
}

// 1. API: Custom AI Course Companion Generator
app.post("/api/courses/generate", async (req, res) => {
  const { subject, topic, level } = req.body;

  if (!subject || !topic) {
    return res.status(400).json({ error: "Subject and Topic are required" });
  }

  const prompt = `Generate a full, highly interactive course study module for the subject "${subject}" and topic "${topic}" geared toward a "${level || 'Intermediate'}" student level.
You must return a complete, valid JSON object that exactly matches the following TypeScript structure. Do not surround with markdown block markers except standard JSON text:
{
  "title": "A highly descriptive title for this topic",
  "overview": "A clear, motivational overview of the topic. Introduce the real-world importance and target outcomes.",
  "durationTotal": "Calculated total study duration (e.g. '1h 45m')",
  "milestones": [
    {
      "stepId": "unique-id-1",
      "title": "Name of the study milestone (e.g. 'Understanding the Fundamentals')",
      "readingContent": "A detailed, beautiful paragraph explaining the concept. Use concrete, engaging real-world analogies (like explaining electricity flow using a water pipe analogy). Add clear explanations.",
      "durationMinutes": 15
    }
  ],
  "projectWork": {
    "projectTitle": "Title of the visual demonstration project",
    "projectDescription": "Describe a mini project that builds this concept from scratch before standard exercises.",
    "timingOutline": "Suggested time breakdown (e.g., '15 mins: Designing Layout | 30 mins: Data Binding')",
    "tutorialSteps": [
      {
        "time": 0,
        "stepTitle": "Intro & Initial Setup",
        "explanation": "Set the foundation. Here is exactly what we are creating and why we start here.",
        "visualizationState": {
          "type": "flowchart",
          "payload": "Start node -> Setup environment variables -> Configure project root"
        }
      },
      {
        "time": 20,
        "stepTitle": "Constructing Key Components",
        "explanation": "Detail the active design block, explaining line-by-line or layer-by-layer.",
        "visualizationState": {
          "type": "code",
          "payload": "const database = initializeConn();\\nconst server = express();\\n// Setup middle blocks"
        }
      },
      {
        "time": 40,
        "stepTitle": "Linking Systems with Core Logic",
        "explanation": "Visual wiring. Show schematic flows and data connections.",
        "visualizationState": {
          "type": "diagram",
          "payload": "[Inputs] ===> [Core Processor] ===> [Data Outputs]"
        }
      },
      {
        "time": 60,
        "stepTitle": "Review & Verification",
        "explanation": "Final visual check. Confirm expectations, metrics, and outcomes.",
        "visualizationState": {
          "type": "math",
          "payload": "Efficiency = (Output_Data / Input_Resources) * 100\\nLoss <= 0.02"
        }
      }
    ]
  },
  "reviewQuiz": [
    {
      "question": "An elegant, conceptual question about the milestone concepts",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIdx": 1,
      "hint": "Provide a helpful, polite reminder about the core definition to point them in the right direction."
    }
  ]
}

Provide extensive details, making sure you include exactly 3 or 4 milestones, 4 detailed video tutorialSteps (timed roughly at 0, 20, 40, and 60 seconds of simulated video playback), and 3 quiz questions. Make the content highly educational, structured, and easy to read. Double-check that all text is fully escaped JSON. Do not include loose trailing commas or triple-backtick annotations at the start and end of the response.`;

  if (!ai) {
    // Return high-quality fallback simulation to keep app fully robust if key isn't provided/active
    return res.json(getCourseSimulation(subject, topic, level));
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are a world-class academic tutor and video outline creator. Your goal is to simplify complex STEM, business, or humanities topics into easy-to-read guides with vivid real-world analogies, step-by-step visual demonstration video outlines, timelines, and review check questions. Always response in clean single-line-friendly parsed JSON conforming strictly to the requested schema. Ensure all keys and strings are properly escaped.",
      },
    });

    const text = response.text || "";
    const parsedData = JSON.parse(text.trim());
    res.json(parsedData);
  } catch (err: any) {
    console.error("Gemini course generation error:", err);
    // Graceful fallback to rich simulation on any parse/API failure
    res.json(getCourseSimulation(subject, topic, level));
  }
});

// 2. API: Custom AI Problem Explainer & Solver (Without giving straight-away codes / answers, focusing on concepts)
app.post("/api/problems/solve", async (req, res) => {
  const { subject, problemStatement } = req.body;

  if (!problemStatement) {
    return res.status(400).json({ error: "Problem statement is required" });
  }

  const prompt = `A student is struggling with the following academic or coding assignment problem in "${subject || 'General Studies'}":
"${problemStatement}"

As an expert educator, generate a complete step-by-step study breakdown that guides them to solve this problem conceptually. DO NOT just write down the final copy-paste code/answer. Instead, break it down like a tutor.
You must return a valid JSON object matching the following structure exactly. Do not include markdown wraps:
{
  "identifiedConcept": "The main educational concepts needed to solve this (e.g. 'Conservation of Momentum' or 'Polymorphism')",
  "conceptGuide": "A detailed 2-3 sentence overview explaining how this works in real life.",
  "analyticalSteps": [
    {
      "stepNum": 1,
      "title": "Phase title (e.g. 'Identify Given Variables')",
      "coachAdvice": "Helpful educational guidance pointing out what to look for in the problem text directly.",
      "criticalFormula": "Main math formula or design pattern standard (e.g. 'F = m * a')",
      "checkQuestion": "A comprehension check question to prompt the student on this intermediate block",
      "checkOptions": ["Option 1", "Option 2", "Option 3"],
      "correctOptionIndex": 0,
      "checkExplanation": "Explanation of why this option is correct."
    }
  ],
  "finalSummary": "A motivational summary on how to verify their final answer and apply this learning to similar challenges."
}

Provide 3 logical diagnostic steps, each with a micro-quiz question so they can interactively verify their work before viewing the next steps. Double-check proper JSON formatting.`;

  if (!ai) {
    return res.json(getProblemSimulation(subject, problemStatement));
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are an encouraging, highly pedagogical academic tutor. You never simply solve problems for students; instead, you break them into clear analytical steps with self-contained micro-questions, equations, and checkpoints that empower the student to solve it on their own.",
      },
    });

    const text = response.text || "";
    const parsedData = JSON.parse(text.trim());
    res.json(parsedData);
  } catch (err: any) {
    console.error("Gemini problem solver error:", err);
    res.json(getProblemSimulation(subject, problemStatement));
  }
});

// Fallback high-fidelity course models
function getCourseSimulation(subj: string, topic: string, level: string) {
  const normSubj = subj.toLowerCase();
  
  // Custom smart templates depending on subject/topic keywords
  if (normSubj.includes("quantum") || normSubj.includes("schrödinger") || normSubj.includes("qubit")) {
    return {
      title: `${topic} - Advanced Quantum Mechanics`,
      overview: "Quantum mechanics coordinates physical particles as mathematical wavefunctions. Transitioning from macroscopic rules to state operators allows us to predict atomic superposition states.",
      durationTotal: "2h 15m",
      milestones: [
        {
          stepId: "qm-ms-1",
          title: "The Wavefunction & Dirac Notation",
          readingContent: "Think of a quantum wave functioning like a probability bubble. Rather than existing at a single rigid coordinate, a particle resides in a continuous cloud of possible states represented by complex state vector brackets.",
          durationMinutes: 30
        },
        {
          stepId: "qm-ms-2",
          title: "Operators & Eigenvalue Equations",
          readingContent: "Measurable traits like momentum or energy correspond to mathematical operator actions. Applying an operator to a wavefunction collapses our potential states into specific eigenvalues.",
          durationMinutes: 35
        },
        {
          stepId: "qm-ms-3",
          title: "Superposition & Entanglement",
          readingContent: "Entanglement links separate qubit states together so that finding the spin value of one instantly clarifies the companion spin, independent of physical distance.",
          durationMinutes: 25
        }
      ],
      projectWork: {
        projectTitle: `${topic} State Operator Calculator`,
        projectDescription: "Build interactive simulations mapping quantum particle density, measuring spin matrices, and modeling infinite square potential steps.",
        timingOutline: "25 mins: Defining Energy Constants | 25 mins: Mapping Sine Waves | 30 mins: Calculating Normalization Constants",
        tutorialSteps: [
          {
            time: 0,
            stepTitle: "Step 1: Setting up Boundary Potentials",
            explanation: "Configure the width L of our potential well and specify boundary state constraints.",
            visualizationState: {
              type: "flowchart",
              payload: "Input Boundary Potential (V=inf) -> Initialize Wavefunction -> Apply Hermiticity -> Calculate Eigenvalues"
            }
          },
          {
            time: 20,
            stepTitle: "Step 2: Plotting Wave Functions",
            explanation: "Write algorithms to evaluate the spatial wavefunction probability density at each position.",
            visualizationState: {
              type: "code",
              payload: "const evaluatePsi = (n: number, x: number, L: number) => {\n  return Math.sqrt(2 / L) * Math.sin((n * Math.PI * x) / L);\n};"
            }
          },
          {
            time: 40,
            stepTitle: "Step 3: Calculating Quantum State Superposition",
            explanation: "Measure probability metrics, observing state vector alignments over complex planes.",
            visualizationState: {
              type: "diagram",
              payload: "[Qubit State |0⟩] ===(Hadamard Gate)===> [Superposition (|0⟩ + |1⟩) / √2] ===(Measurement)===> |1⟩"
            }
          },
          {
            time: 60,
            stepTitle: "Step 4: Wavefunction Integration Check",
            explanation: "Ensure entire space probability integrates to 1. Verify correct normalization coefficients.",
            visualizationState: {
              type: "math",
              payload: "E_n = (n^2 * \\pi^2 * \\hbar^2) / (2 * m * L^2)\n\\int_0^L |\\Psi(x,t)|^2 dx = 1"
            }
          }
        ]
      },
      reviewQuiz: [
        {
          question: "What physical quantity does the integral of absolute Psi squared over a volume direct?",
          options: [
            "The net electrical charges of particles",
            "The absolute probability of detecting the particle within that space",
            "The rotational friction threshold",
            "The kinetic mass decay multiplier"
          ],
          correctIdx: 1,
          hint: "Think about the statistical interpretation of wavefunctions formulated by Max Born."
        },
        {
          question: "Which quantum operator corresponds to extracting mechanical energy expectation values?",
          options: [
            "The Spatial Operator",
            "The Hamiltonian Operator",
            "The Kinetic Friction Pivot",
            "The Gaussian Gradient Node"
          ],
          correctIdx: 1,
          hint: "The Hamiltonian represents total mechanical energy (kinetic + potential energy)."
        }
      ]
    };
  } else if (normSubj.includes("machine learning") || normSubj.includes("neural") || normSubj.includes("backpropagation") || normSubj.includes("network")) {
    return {
      title: `${topic} - Advanced Neural Systems`,
      overview: "Machine Learning models convert numeric inputs into probabilistic inferences. Tracking mathematical weights updates via gradient descent facilitates neural convergence.",
      durationTotal: "2h 00m",
      milestones: [
        {
          stepId: "ml-ms-1",
          title: "Forward Propagation & Layer Transitions",
          readingContent: "Think of feedforward steps like a river feeding channels. Input coordinates are dot-product multiplied by weight matrix grids, bias values are added, and sigmoidal activation maps compress outputs neatly.",
          durationMinutes: 25
        },
        {
          stepId: "ml-ms-2",
          title: "Objective Loss Functions",
          readingContent: "Loss functions measure error. Cross-entropy loss calculates exactly how far off predictions are from correct categorical targets, tracking a smooth optimization slope.",
          durationMinutes: 30
        },
        {
          stepId: "ml-ms-3",
          title: "Backpropagation & Chain Rule",
          readingContent: "Backpropagation is of critical importance. By tracing parameters backward using calculus chain rules, we determine exactly which node needs adjustments to minimize costs.",
          durationMinutes: 35
        }
      ],
      projectWork: {
        projectTitle: `${topic} Neural Network Engine`,
        projectDescription: "Build interactive model visualizers tracking weight matrix variables, forward feeds, cost calculations, and backprop adjustments.",
        timingOutline: "20 mins: Matrix Classes Setup | 25 mins: Forward Processing Feed | 30 mins: Layer Gradient Derivations",
        tutorialSteps: [
          {
            time: 0,
            stepTitle: "Step 1: Instantiating Weights matrices",
            explanation: "Generate randomized weight arrays, apply Xavier-normalized variables, and catalog bias values.",
            visualizationState: {
              type: "flowchart",
              payload: "Input Nodes -> Weight Matrices -> Hidden Activation -> Softmax Projection -> Loss Compute"
            }
          },
          {
            time: 20,
            stepTitle: "Step 2: Activating Hidden Layers",
            explanation: "Implement sigmoid, tanh, or ReLU formulas to introduce non-linearity into neural arrays.",
            visualizationState: {
              type: "code",
              payload: "const relu = (z: number) => Math.max(0, z);\nconst reluDerivative = (z: number) => z > 0 ? 1 : 0;"
            }
          },
          {
            time: 40,
            stepTitle: "Step 3: Forward Feedback Mapping",
            explanation: "Plot active matrix shapes, tracing paths of computational nodes under progressive dense layer transforms.",
            visualizationState: {
              type: "diagram",
              payload: "[Input_X] ---> [Layer_W1 + b1] ===(ReLU)===> [Hidden_h] ---> [Layer_W2 + b2] ===(Softmax)===> [Pred_Y]"
            }
          },
          {
            time: 60,
            stepTitle: "Step 4: Gradient Calculation update",
            explanation: "Minimize cross entropy error. Adjust matrices backward utilizing gradient epochs step multipliers.",
            visualizationState: {
              type: "math",
              payload: "L = - \\sum y_i \\cdot \\ln\\hat{y}_i\nW_{new} = W_{old} - \\eta \\cdot \\Delta_W L"
            }
          }
        ]
      },
      reviewQuiz: [
        {
          question: "Which algorithm propagates loss derivatives backwards to compute parameter gradients?",
          options: [
            "Linear regression sampling",
            "Backpropagation using the chain rule",
            "Binary search index splits",
            "Gaussian elimination of bounds"
          ],
          correctIdx: 1,
          hint: "The chain rule allows layers to exchange error rates continuously backward."
        },
        {
          question: "What occurs if you choose an excessively high training step multiplier (learning rate)?",
          options: [
            "The model stops training instantly",
            "The weights fail to change at all",
            "Loss starts to oscillate or explode indefinitely",
            "CPU cooling modules fail instantly"
          ],
          correctIdx: 2,
          hint: "High multipliers lead to overshooting state minimum paths, causing divergent math metrics."
        }
      ]
    };
  } else if (normSubj.includes("distributed") || normSubj.includes("paxos") || normSubj.includes("raft") || normSubj.includes("consensus")) {
    return {
      title: `${topic} - Advanced Replica Coordination`,
      overview: "Distributed systems organize separate computing components to look like a single machine. Consensus algorithms prevent split-brain states through voting quorums.",
      durationTotal: "1h 45m",
      milestones: [
        {
          stepId: "ds-ms-1",
          title: "The Problem of Consensus",
          readingContent: "Consensus is coordination over broken pipelines. If physical network lines fail or lag, nodes must guarantee they write identical, chronological data sequences.",
          durationMinutes: 25
        },
        {
          stepId: "ds-ms-2",
          title: "Quorum Architecture Overlaps",
          readingContent: "A cluster requires a clear mathematical majority voting group. Because any two majorities must intersect at least at one common node, safe values are maintained.",
          durationMinutes: 30
        },
        {
          stepId: "ds-ms-3",
          title: "Consensus States (Raft / Paxos)",
          readingContent: "Paxos executes coordinate stages: prepare requests promise acceptors refuse older proposals, allowing leader nodes to safely commit final sequence states.",
          durationMinutes: 25
        }
      ],
      projectWork: {
        projectTitle: `${topic} Consortium Simulator`,
        projectDescription: "Build interactive simulations representing cluster networks, scheduling partitions, voting ballots, and multi-node replicated log sync.",
        timingOutline: "20 mins: Cluster Nodes setup | 25 mins: Messaging Loops | 30 mins: Leader Election Quorums",
        tutorialSteps: [
          {
            time: 0,
            stepTitle: "Step 1: Booting Member Nodes",
            explanation: "Spin up simulated nodes, allocate ballot state vectors, and bind network event communication channels.",
            visualizationState: {
              type: "flowchart",
              payload: "Node Startup -> Join Cluster -> Start Heartbeat -> Wait for Proposals"
            }
          },
          {
            time: 20,
            stepTitle: "Step 2: Proposing Ballot Values",
            explanation: "Implement prepares promising, rejecting ballot IDs lower than currently recorded values.",
            visualizationState: {
              type: "code",
              payload: "class PaxosNode {\n  receivePrepare(ballotNum) {\n    if (ballotNum > this.promisedBallot) {\n      this.promisedBallot = ballotNum;\n      return { status: 'PROMISE', acceptedVal: this.acceptedVal };\n    }\n    return { status: 'REJECT' };\n  }\n}"
            }
          },
          {
            time: 40,
            stepTitle: "Step 3: Network Partition splits",
            explanation: "Trace cluster divides separating voters. Show why minority partition divisions refuse new log writes.",
            visualizationState: {
              type: "diagram",
              payload: "[Node 1, Node 2] <---- Network partition block ----> [Node 3, Node 4, Node 5 (Quorum = 3)]"
            }
          },
          {
            time: 60,
            stepTitle: "Step 4: Committing Safe Sequences",
            explanation: "Commit variables when proposals claim quorum agreement records. Update replica log indexes.",
            visualizationState: {
              type: "math",
              payload: "Quorum = \\lfloor N / 2 \\rfloor + 1 = 3 \\quad (N=5)\nConsensusState_{committed} = AcceptRatio >= 3/5"
            }
          }
        ]
      },
      reviewQuiz: [
        {
          question: "With a total cluster of 5 independent nodes, what is the minimum quorum required to secure a consensus update?",
          options: [
            "2 nodes",
            "3 nodes",
            "4 nodes",
            "5 nodes"
          ],
          correctIdx: 1,
          hint: "The formula is majority: floor(N/2) + 1. For 5 nodes, floor(2.5) + 1 = 3 nodes."
        },
        {
          question: "What core guarantee ensures that older accepted values are not lost during subsequent proposals?",
          options: [
            "Proposers must adopt and pitch the highest ballot value returned from prepare responses",
            "Acceptors delete their entries on seeing new prepare commands",
            "Values are written to flat text files with infinite retention",
            "Leader elections restart every 10 seconds unconditionally"
          ],
          correctIdx: 0,
          hint: "If an earlier proposal was accepted by some nodes, a proposer will see it in the returned Prepare promises and must use it."
        }
      ]
    };
  } else if (normSubj.includes("computer") || normSubj.includes("code") || normSubj.includes("react") || normSubj.includes("programming")) {
    return {
      title: `Mastering ${topic} - Architectural Development`,
      overview: "Computer Science is about turning logical frameworks into working systems. Learning through functional projects makes complex concepts stick by letting you see state changes in action.",
      durationTotal: "1h 30m",
      milestones: [
        {
          stepId: "cs-ms-1",
          title: "Architecture & Framework Concepts",
          readingContent: "Think of your project architecture like blueprint planning for a smart house. Instead of writing code raw, we define isolated components, handle data interfaces, and model how information propagates through the system.",
          durationMinutes: 20
        },
        {
          stepId: "cs-ms-2",
          title: "Handling Inputs & Managing States",
          readingContent: "State management is the interactive engine of your application. Just like a thermostat tracks ambient temperatures to trigger coolers, your code tracks user interactions to trigger clean screen updates dynamically.",
          durationMinutes: 25
        },
        {
          stepId: "cs-ms-3",
          title: "Error Handling & Diagnostic Loops",
          readingContent: "Bugs are natural extensions of system building. Effective developers design validation systems early, wrapping tricky asynchronous pipelines in safe try-catch handlers to give users graceful, descriptive feedback.",
          durationMinutes: 15
        }
      ],
      projectWork: {
        projectTitle: `Custom Real-time ${topic} Application`,
        projectDescription: "A fully working project prototype centering event callbacks, input validation, and progressive UI state rendering.",
        timingOutline: "15 mins: Core Classes Setup | 25 mins: Binding State Updates | 20 mins: Simulating Network Stress",
        tutorialSteps: [
          {
            time: 0,
            stepTitle: "Step 1: Scaffolding Directory & Logic Layers",
            explanation: "Create the folder hierarchy, define shared type system declarations, and boot up the local build server safely.",
            visualizationState: {
              type: "flowchart",
              payload: "User Actions -> Express Route Gateway -> Core Controller -> UI Updater"
            }
          },
          {
            time: 20,
            stepTitle: "Step 2: Constructing state interfaces",
            explanation: "Implement reactive hooks or local listeners to process real-time events without triggering structural rebuild lag.",
            visualizationState: {
              type: "code",
              payload: "interface AppState {\n  data: Record<string, any>;\n  isLoading: boolean;\n  activeId: string | null;\n}\n\n// Update state with shallow merge\nconst updateState = (slice: Partial<AppState>) => {\n  state = { ...state, ...slice };\n  render();\n};"
            }
          },
          {
            time: 40,
            stepTitle: "Step 3: Integrating diagnostic loops",
            explanation: "Set up boundary guards and capture logs. We simulate potential latency offsets to inspect render behaviors.",
            visualizationState: {
              type: "diagram",
              payload: "[UI Component] --triggers dispatch--> [Reducer Node] --writes state--> [Display Canvas]"
            }
          },
          {
            time: 60,
            stepTitle: "Step 4: Compiling & Deployment setup",
            explanation: "Minify code builds, package asset outputs into static folders, and configure environmental paths for servers.",
            visualizationState: {
              type: "math",
              payload: "CompressionRatio = Size_raw / Size_compiled = 4.2x\nResponseTime_target <= 120ms"
            }
          }
        ]
      },
      reviewQuiz: [
        {
          question: "Why do we isolate state variables instead of keeping them global in code repositories?",
          options: [
            "It increases total memory consumption",
            "It limits unauthorized mutations and prevents unpredictable side-effects",
            "Global variables perform calculations 10 times faster",
            "Single files require compile-time headers"
          ],
          correctIdx: 1,
          hint: "Think about single source of truth guidelines and the risk of multiple components editing the same variable simultaneously."
        },
        {
          question: "Which pattern is most effective for handling unreliable external API requests?",
          options: [
            "Assume requests always complete immediately",
            "Wrap queries in safe verification try-catch guards with network timeouts",
            "Run continuous while-loops without delays to force responses",
            "Delete corresponding interface segments"
          ],
          correctIdx: 1,
          hint: "Continuous processing without pauses hangs CPU threads. Defensive programming handles errors gracefully."
        }
      ]
    };
  } else if (normSubj.includes("math") || normSubj.includes("calculus") || normSubj.includes("algebra") || normSubj.includes("physics") || normSubj.includes("chemistry") || normSubj.includes("science")) {
    return {
      title: `Analyzing ${topic} - Fundamental Calculus & Principles`,
      overview: "Scientific reasoning focuses on mathematical modeling. By translating physical parameters into formulas, we can simulate change, predict efficiency, and build concrete solutions.",
      durationTotal: "1h 50m",
      milestones: [
        {
          stepId: "sci-ms-1",
          title: "Physical Interpretation & Variables",
          readingContent: "Before looking at hard mathematics, observe how the system breathes. For example, in thermodynamics, pressure, volume, and temperature form an absolute balancing act—if you constrict space, the particles strike borders faster, raising thermal energy.",
          durationMinutes: 25
        },
        {
          stepId: "sci-ms-2",
          title: "Mathematical Foundations & Derivatives",
          readingContent: "Equations are descriptions of rate of change. Calculating a derivative is like watching a speedometer in a car: instead of telling you overall distance, it reveals exactly how fast your position modifies at that precise instance.",
          durationMinutes: 30
        },
        {
          stepId: "sci-ms-3",
          title: "Equilibrium & Conservation laws",
          readingContent: "Nothing is created from nothing. Systems naturally adjust toward state minimums. In structural builds, downward gravitational stresses must be precisely countered by the normal force of supports.",
          durationMinutes: 20
        }
      ],
      projectWork: {
        projectTitle: `${topic} Analytical Simulation Engine`,
        projectDescription: "Build interactive graphs and step diagrams simulating system forces, ratios, and rates of change.",
        timingOutline: "20 mins: Defining Constants & Axes | 20 mins: Mapping Functional Functions | 20 mins: Measuring Limits",
        tutorialSteps: [
          {
            time: 0,
            stepTitle: "Step 1: Setting Boundary Parameters",
            explanation: "Define critical limits, initial conditions, conservation constants, and output coordinate mapping.",
            visualizationState: {
              type: "flowchart",
              payload: "Input boundary conditions -> Check thermal limits -> Evaluate equations -> Display Curve"
            }
          },
          {
            time: 20,
            stepTitle: "Step 2: Plotting Equations",
            explanation: "Translate formulas into functional mapping algorithms, generating curve data across continuous steps.",
            visualizationState: {
              type: "code",
              payload: "const generateCurve = (limit: number) => {\n  const points = [];\n  for (let x = 0; x <= limit; x += 0.1) {\n    const y = Math.pow(x, 2) - 4 * x;\n    points.push({ x, y });\n  }\n  return points;\n};"
            }
          },
          {
            time: 40,
            stepTitle: "Step 3: Drawing Force Diagrams",
            explanation: "Isolate vectors, balance forces, and render vector directions representing current tension directions.",
            visualizationState: {
              type: "diagram",
              payload: "Normal Stress (Y+) <------ [Object Volume] -------> Tension Frictional Drag (X-)"
            }
          },
          {
            time: 60,
            stepTitle: "Step 4: Validating Calculations",
            explanation: "Verify continuous states, calculate numeric approximations, check tolerances, and export metrics.",
            visualizationState: {
              type: "math",
              payload: "f(x) = lim (h -> 0) [f(x + h) - f(x)] / h\nIntegral_S = sum(y_i * dx)"
            }
          }
        ]
      },
      reviewQuiz: [
        {
          question: "What does the first derivative of a moving particle's positional function physically represent?",
          options: [
            "Total distance traveled over time",
            "Its instantaneous velocity",
            "Its rotational friction offset",
            "The ambient mass density"
          ],
          correctIdx: 1,
          hint: "The derivative calculates the rate of change of position with respect to time."
        },
        {
          question: "When a system achieves static mechanical equilibrium, what is the net sum of all forces acting upon it?",
          options: [
            "Precisely Equal to Mass times Gravity squared",
            "Exactly Zero",
            "Increasing proportionally to speed",
            "Indefinitely unpredictable"
          ],
          correctIdx: 1,
          hint: "Static equilibrium implies no motion modification, meaning all opposing vectors cancel each other fully."
        }
      ]
    };
  }

  // General default fallback Template
  return {
    title: `Step-by-Step Mastery of ${topic}`,
    overview: `An interactive academic session focused on understanding ${topic} systematically under "${subj}", preparing you for real-world projects and exam solutions.`,
    durationTotal: "1h 15m",
    milestones: [
      {
        stepId: "gen-ms-1",
        title: "Introduction to Major Assumptions",
        readingContent: `Before studying complex equations, let's explore why "${topic}" matters. We look at typical assumptions, identifying how variables collaborate and outline basic real-world dependencies to construct a reliable framework.`,
        durationMinutes: 15
      },
      {
        stepId: "gen-ms-2",
        title: "Core Mechanics and Relationships",
        readingContent: `Here, we study specific interactions. Think of it like a chain reactions index: if one parameter increases, see how auxiliary points adjust to satisfy fundamental laws of "${subj}". We emphasize modular reasoning.`,
        durationMinutes: 20
      },
      {
        stepId: "gen-ms-3",
        title: "Critical Analysis & Problem Frameworks",
        readingContent: "We conclude by building a reusable checklist to navigate homework challenges. Learn where typical errors occur, what boundary conditions to double-check, and how to verify numerical or logic outputs.",
        durationMinutes: 15
      }
    ],
    projectWork: {
      projectTitle: `${topic} Analytical Project`,
      projectDescription: `A hands-on exercise containing visual structures, structured timelines, and clear metrics designed to test your command of ${topic}.`,
      timingOutline: "10 mins: Outlining Elements | 20 mins: Structural Interconnection | 15 mins: Review Diagnostic Results",
      tutorialSteps: [
        {
          time: 0,
          stepTitle: "Phase A: System Scaffolding",
          explanation: "Outline base concepts, list standard values, align boundary thresholds, and arrange layout parameters.",
          visualizationState: {
            type: "flowchart",
            payload: "Define Context Parameters -> Assemble Variables -> Set Operational Thresholds -> Evaluate UI States"
          }
        },
        {
          time: 20,
          stepTitle: "Phase B: Structuring Core Interfaces",
          explanation: "Program key functional algorithms processing student logic, aligning variables dynamically.",
          visualizationState: {
            type: "code",
            payload: "function processTopic(ctx) {\n  const factor = ctx.level === 'Advanced' ? 1.5 : 1.0;\n  return {\n    topicStatus: 'ACTIVE',\n    multiplier: factor * 9.81\n  };\n}"
          }
        },
        {
          time: 40,
          stepTitle: "Phase C: Data Mapping & Diagram Visuals",
          explanation: "Draw schematic diagrams tracing variable interactions visually to build strong cognitive links.",
          visualizationState: {
            type: "diagram",
            payload: "Subject Core Node ===> [Active Process Module] ===> Target Assessment State"
          }
        },
        {
          time: 60,
          stepTitle: "Phase D: Diagnostics & Verification Check",
          explanation: "Apply testing constraints across typical configurations to guarantee full system stability and accuracy.",
          visualizationState: {
            type: "math",
            payload: "ProgressPercentage = (StepsCompleted / TotalRequiredSteps) * 100\nValidationRate >= 0.99"
          }
        }
      ]
    },
    reviewQuiz: [
      {
        question: `Which approach is most recommended when introducing an action framework under ${topic}?`,
        options: [
          "Apply calculations blind without checking initial boundaries",
          "Identify and isolate core variables, establishing reliable baseline assumptions first",
          "Copy solutions directly from random templates without structural adaptation",
          "Skip the baseline setup because it adds negligible value"
        ],
        correctIdx: 1,
        hint: "Isolating constraints prevents cascading configuration errors down the analytical path."
      }
    ]
  };
}

// Fallback high-fidelity problem solver
function getProblemSimulation(subj: string, statement: string) {
  const normSubj = subj.toLowerCase();
  const normStmt = statement.toLowerCase();

  if (normSubj.includes("quantum") || normStmt.includes("quantum") || normStmt.includes("schrödinger") || normStmt.includes("qubit")) {
    return {
      identifiedConcept: "Quantum Perturbation Theory & Schrödinger State Superposition",
      conceptGuide: "Quantum mechanics solves states by expanding the wave function into continuous orthogonal basis vectors and applying operators representing measurable bounds like position and momentum.",
      analyticalSteps: [
        {
          stepNum: 1,
          title: "Define State Superposition Boundaries",
          coachAdvice: "Represent the candidate quantum state |ψ⟩ as a normalized linear combination of system eigenbasis vectors |φ_n⟩.",
          criticalFormula: "|ψ⟩ = ∑ c_n |φ_n⟩, where ∑ |c_n|² = 1",
          checkQuestion: "What does the probability coefficient |c_n|² denote physically in a state measurement?",
          checkOptions: ["The absolute quantization energy of state n", "The probability of finding the particle in eigenstate |φ_n⟩", "The potential barrier density"],
          correctOptionIndex: 1,
          checkExplanation: "The Born rule states that the squared modulus of the quantum state's probability amplitude yields the measurement probability."
        },
        {
          stepNum: 2,
          title: "Apply Schrödinger Time-Independent Hamiltonian",
          coachAdvice: "Use the operator H = - (hbar² / 2m) ∂²/∂x² + V(x) to evaluate energy expectation values.",
          criticalFormula: "H |ψ⟩ = E |ψ⟩",
          checkQuestion: "In an infinite square well of width L, what are the allowed quantized energy levels E_n?",
          checkOptions: ["E_n = n² π² hbar² / (2 m L²)", "E_n = n π hbar / L", "E_n = constant zero"],
          correctOptionIndex: 0,
          checkExplanation: "Quantizing boundaries results in sine wave harmonics with energy proportional to n²."
        },
        {
          stepNum: 3,
          title: "Evaluate Normalization Constraints",
          coachAdvice: "Symmetric physical spaces ensure that wave functions integrate to unity over all space (-inf to +inf).",
          criticalFormula: "∫ |ψ(x)|² dx = 1",
          checkQuestion: "If the spatial integral of a candidate wave function yields 4, what is the required normalization constant A to scale it to unity?",
          checkOptions: ["A = 0.5", "A = 2", "A = 0.25"],
          correctOptionIndex: 0,
          checkExplanation: "We multiply by A, so ∫ |A ψ|² dx = A² * 4 = 1. Thus A = 1/sqrt(4) = 0.5."
        }
      ],
      finalSummary: "Excellent! You have conceptually resolved the wave equation bounds. Isolate the Hamiltonian, integrate state products to verify normalization, and calculate coefficients with the Born rule!"
    };
  }

  if (normSubj.includes("machine learning") || normSubj.includes("neural") || normStmt.includes("neural") || normStmt.includes("backprop") || normStmt.includes("layer")) {
    return {
      identifiedConcept: "Stochastic Gradient Descent & Backpropagation chain-rule updates",
      conceptGuide: "Machine learning relies on computing partial derivatives of a loss objective function with respect to weights across layers to update parameter paths iteratively.",
      analyticalSteps: [
        {
          stepNum: 1,
          title: "Compute Loss Function Error Margin",
          coachAdvice: "Formulate the cross-entropy cost or mean squared error (MSE) to find deviations between predictions (y-hat) and targets (y).",
          criticalFormula: "L = - ∑ y_i * log(ŷ_i)",
          checkQuestion: "What is the primary derivative of cross-entropy loss relative to standard Softmax outputs (ŷ - y)?",
          checkOptions: ["The error signal vector (ŷ - y)", "Half the squared variance of outputs", "Logarithmic scalar bias scaling factor"],
          correctOptionIndex: 0,
          checkExplanation: "Evaluating ∂L/∂z for cross-entropy with Softmax simplifies beautifully to (ŷ - y), indicating a direct linear delta."
        },
        {
          stepNum: 2,
          title: "Apply Multi-Layer Chain Rule Matrices",
          coachAdvice: "Propagate the error gradient backward by multiplying subsequent layer weights transposition matrices.",
          criticalFormula: "δ_l = (W_next^T * δ_next) ⊙ σ'(z_l)",
          checkQuestion: "What does the symbol ⊙ represent in the backpropagation matrix formulation?",
          checkOptions: ["Matrix dot dot product", "Hadamard (element-wise) multiplication", "Tensor matrix cross-product"],
          correctOptionIndex: 1,
          checkExplanation: "The derivative of the local activation function is applied element-wise (Hadamard product) to match layer dimensions."
        },
        {
          stepNum: 3,
          title: "Construct Learning Rate Updates",
          coachAdvice: "Use the computed gradients to subtract small, controlled steps from candidate weight variables.",
          criticalFormula: "W_new = W_old - η * ∂L/∂W",
          checkQuestion: "If learning rate η is set too high, what risk is introduced during optimization epochs?",
          checkOptions: ["Model converges too slowly to be useful", "Loss oscillates or diverges indefinitely", "Weights remain constant zero values"],
          correctOptionIndex: 1,
          checkExplanation: "Extremely high learning rates overshoot local minima, causing the optimizer to bounce across valleys and potentially explode loss."
        }
      ],
      finalSummary: "Success! You have calculated backpropagation updates conceptually. Compute the outward error signal, propagate using weight transposes, and step weights via learning parameter steps."
    };
  }

  if (normSubj.includes("distributed") || normSubj.includes("paxos") || normSubj.includes("raft") || normSubj.includes("consensus") || normStmt.includes("paxos") || normStmt.includes("raft") || normStmt.includes("consensus")) {
    return {
      identifiedConcept: "Multi-Paxos Replicated Log Coordination",
      conceptGuide: "Distributed consensus guarantees that a cluster of machines can agree on state transitions even if some fail, by enforcing majority quorum overlaps across proposals.",
      analyticalSteps: [
        {
          stepNum: 1,
          title: "Establish Quorum Safe Overlap",
          coachAdvice: "A system of N nodes requires a minimum voting group (majority) to agree on values before committing.",
          criticalFormula: "QuorumSize = ⌊N/2⌋ + 1",
          checkQuestion: "In a cluster of 5 nodes, what is the maximum number of simultaneous node crashes the system can survive?",
          checkOptions: ["1 node crash", "2 node crashes", "3 node crashes"],
          correctOptionIndex: 1,
          checkExplanation: "With 5 nodes, quorum size is 3. To maintain a quorum, we must have at least 3 nodes alive, meaning at most 2 can fail (5 - 3 = 2)."
        },
        {
          stepNum: 2,
          title: "Execute Two-Phase Prepare and Propose Sequence",
          coachAdvice: "Proposers send Prepare(n) to claim leadership, and accept returned higher ballot numbers before proposing Accept(n, value).",
          criticalFormula: "Identify highest ballot number returned: max(ballots)",
          checkQuestion: "Why must Paxos acceptors refuse Prepare(n) if they already promised a ballot higher than n?",
          checkOptions: ["To conserve CPU workloads", "To guarantee that older proposals don't overwrite committed newer records", "To trigger automatic cluster restarts"],
          correctOptionIndex: 1,
          checkExplanation: "Strict sequencing ensures that once a value is chosen, no proposer can introduce an older, conflicting value."
        },
        {
          stepNum: 3,
          title: "Mitigate Network Split Brains",
          coachAdvice: "When network partitioning divides the system, only the partition containing a true majority quorum can progress.",
          criticalFormula: "PartitionA_size >= Quorum || PartitionB_size >= Quorum",
          checkQuestion: "What happens to log writes sent to a minority partition of size 2 in a 5-node cluster?",
          checkOptions: ["They are rejected or deferred because they cannot assemble a majority quorum", "They are written instantly and synced later via magic", "They cause both nodes to delete their entire database"],
          correctOptionIndex: 0,
          checkExplanation: "Two nodes cannot achieve a quorum of 3, so they must defer or reject proposals to preserve data integrity."
        }
      ],
      finalSummary: "Wonderful! You've navigated the consensus puzzle. Calculate quorum constraints, preserve older proposals with ballot promises, and ensure only majorities commit log states."
    };
  }

  return {
    identifiedConcept: "Progressive Analysis & Boundary Isolation",
    conceptGuide: "Tackling difficult educational problems involves dividing high-level goals into smaller sequential stages. By validating each step before continuing, you eliminate confusing mistakes.",
    analyticalSteps: [
      {
        stepNum: 1,
        title: "Isolating Key Target Variables",
        coachAdvice: "Read the problem carefully and look for numeric counts, conditions, or target keywords. What are you requested to solve, and what limits are already defined directly in the prompt?",
        criticalFormula: "Givens = { Known Constants, Target Variables, System Restrictions }",
        checkQuestion: "What is the very first thing to do before writing any formulas or logic blocks?",
        checkOptions: [
          "Calculate values instantly with random guesses",
          "Clearly catalog given variables and expected outcome structures to trace the logical path",
          "Search online for a direct copy-paste answer sheet"
        ],
        correctOptionIndex: 1,
        checkExplanation: "Knowing what you have and what you want determines which equations or procedures are applicable."
      },
      {
        stepNum: 2,
        title: "Mapping Core Principles & Equations",
        coachAdvice: "Connect your givens to known definitions under this subject. What rules regulate the physical state, or what programming abstractions isolate this component?",
        criticalFormula: "StateRelation: F_net = 0 (equilibrium) or Output = Process(Inputs)",
        checkQuestion: "If you have opposing variable parameters in high-stress positions, what should you do?",
        checkOptions: [
          "Check for balancing equations or conservation equations that link both factors",
          "Delete one of the opposing factors so the system runs cleanly",
          "Double the values of both elements to ensure plenty of padding"
        ],
        correctOptionIndex: 0,
        checkExplanation: "Conservation laws or clear interfaces explain how opposing variables adjust under pressure."
      },
      {
        stepNum: 3,
        title: "Final Verification & Sanity Evaluation",
        coachAdvice: "Once you have built a prospective solution, test it against physical limits. Does the result sound realistic? Check units, boundary margins, and potential syntax bottlenecks.",
        criticalFormula: "ErrorMargin = |Actual - Predicted| / Actual <= Tolerance",
        checkQuestion: "How do you confirm that your computed student result is valid?",
        checkOptions: [
          "Ask an external AI to immediately confirm and grade it as perfect",
          "Substitute your solved variables back into original constraint equations to check if they balance perfectly",
          "If the build compiles without crash, assume the math is correct"
        ],
        correctOptionIndex: 1,
        checkExplanation: "Substitution is the gold standard for verifying algebraic, numeric, or programmatic assertions."
      }
    ],
    finalSummary: "Excellent! You now have a complete conceptual strategy. Isolate givens, match governing templates, solve sequentially, and finish by validating back into constraints. You're ready to master this problem!"
  };
}

// Simple file-backed database storage pattern for realistic full-stack integration
const DB_FILE = path.join(process.cwd(), "db.json");

interface ServerStoredData {
  deadlines: any[];
  studyLogs: any[];
  scratchNotes: string;
  leaderboard: any[];
  resources: any[];
}

const defaultDb: ServerStoredData = {
  deadlines: [
    { id: "dl-1", title: "Complete CS Recursion Exercises", subject: "Computer Science", date: "2026-06-20", completed: false },
    { id: "dl-2", title: "Math Assignment 4: Integrals", subject: "Calculus", date: "2026-06-22", completed: false },
    { id: "dl-3", title: "Physics Lab Data Plotting", subject: "Physics", date: "2026-06-18", completed: true }
  ],
  studyLogs: [
    { id: "log-1", topic: "Recursion Concepts", duration: 25, date: "2026-06-14", xpGained: 55, comments: "Understood base cases and stack depths." },
    { id: "log-2", topic: "Riemann Integration", duration: 30, date: "2026-06-15", xpGained: 65, comments: "Calculated infinite rectangular bounds." }
  ],
  scratchNotes: "# Custom Research Draft Pads & Equations\n\nWelcome! This workspace pad is **backed by our Express full-stack server endpoints**. Anything you type here automatically synchronizes to the server database.\n\n### Core Equation Models\n- **Calculus Limit**: \n  $$\\lim_{x \\to c} f(x) = L$$\n- **Einstein Normal Tension Vector**:\n  $$F_{tension} = \\mu_d \\cdot m \\cdot g$$\n\n### Milestones Remaining\n1. [x] Read interactive course syllabus on Limits\n2. [ ] Complete Step-by-step physics diagnostic checkoff puzzle\n3. [ ] Achieve Level 5 Scholar Badge (needs 500 XP total)",
  leaderboard: [
    { name: "Ada Lovelace", xp: 580, badge: "Algorithm Queen 💻" },
    { name: "Marie Curie", xp: 510, badge: "Physics Pioneer 🚀" },
    { name: "Albert Einstein", xp: 450, badge: "Calculus Master 📐" },
    { name: "Guest Scholar", xp: 150, badge: "Rising Star 🌟" }
  ],
  resources: [
    {
      id: "res-1",
      title: "MIT OpenCourseWare: Introduction to Algorithms",
      url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
      courseSubject: "Computer Science",
      category: "Textbook",
      notes: "Top-tier reference material on recursion, asymptotic runtimes, heap structures, and graph traversals.",
      isFavorite: true,
      createdAt: "2026-06-15T10:00:00.000Z"
    },
    {
      id: "res-2",
      title: "Visualgo: Visualising Algorithms & Data Structures",
      url: "https://visualgo.net/en",
      courseSubject: "Computer Science",
      category: "Documentation",
      notes: "Fascinating animated interactive sandbox on lists, trees, recursion sorting, and graphs.",
      isFavorite: false,
      createdAt: "2026-06-15T11:30:00.000Z"
    },
    {
      id: "res-3",
      title: "Paul's Online Math Notes: Calculus I",
      url: "https://tutorial.math.lamar.edu/classes/calcI/calcI.aspx",
      courseSubject: "Calculus",
      category: "Cheat Sheet",
      notes: "Best-in-class concise notes with solved practices on limits, continuity, derivative formulas, and integrations.",
      isFavorite: true,
      createdAt: "2026-06-15T12:00:00.000Z"
    },
    {
      id: "res-4",
      title: "3Blue1Brown: Essence of Calculus Playlist",
      url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr",
      courseSubject: "Calculus",
      category: "YouTube",
      notes: "Stellar visual intuitive animations for derivatives, integrals, limits, and Taylor polynomials.",
      isFavorite: false,
      createdAt: "2026-06-15T12:15:00.000Z"
    },
    {
      id: "res-5",
      title: "Feynman Lectures on Physics: Volume 1",
      url: "https://www.feynmanlectures.caltech.edu/I_toc.html",
      courseSubject: "Physics",
      category: "Textbook",
      notes: "Essential foundational text covering Newtonian mechanics, energy, tension forces, and relativity.",
      isFavorite: true,
      createdAt: "2026-06-15T13:00:00.000Z"
    },
    {
      id: "res-6",
      title: "Stanford Encyclopedia of Philosophy: Quantum Mechanics",
      url: "https://plato.stanford.edu/entries/qm/",
      courseSubject: "Quantum Physics",
      category: "Research Paper",
      notes: "Deep formal review of eigenstates, Copenhagen interpretation, and wave-particle mechanics.",
      isFavorite: false,
      createdAt: "2026-06-15T14:00:00.000Z"
    }
  ]
};

function readDatabase(): ServerStoredData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const txt = fs.readFileSync(DB_FILE, "utf-8");
      const data = JSON.parse(txt);
      if (!data.resources) {
        data.resources = defaultDb.resources;
        writeDatabase(data);
      }
      return data;
    }
  } catch (err) {
    console.error("Failed to parse db.json, generating default.", err);
  }
  // Write initial default
  writeDatabase(defaultDb);
  return defaultDb;
}

function writeDatabase(data: ServerStoredData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to db.json", err);
  }
}

// REST endpoints for Full-stack synchronizations
app.post("/api/avatar/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Prompt string is required" });
  }

  // Fallback high-fidelity avatar URL list based on seeds
  const getFallbackUrl = (p: string) => {
    const cleanPrompt = p.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    // Use a high-quality stylized avatar API like dicebear or a consistent picsum seed
    return `https://picsum.photos/seed/${cleanPrompt || "scholar"}/300/300`;
  };

  if (!ai) {
    console.log("No Gemini API key found, returning simulated custom avatar URL.");
    return res.json({ imageUrl: getFallbackUrl(prompt), simulated: true });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: {
        parts: [
          {
            text: `High-quality, polished educational profile avatar of: ${prompt}. Centered, vibrant colors, minimalist style, suitable for a scholar companion platform avatar representation.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64EncodeString = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";
          const imageUrl = `data:${mimeType};base64,${base64EncodeString}`;
          return res.json({ imageUrl, simulated: false });
        }
      }
    }

    // If no inline data but call succeeded
    return res.json({ imageUrl: getFallbackUrl(prompt), simulated: true });
  } catch (err: any) {
    console.error("Gemini avatar generation failed, serving fallback:", err?.message || err);
    return res.json({ imageUrl: getFallbackUrl(prompt), simulated: true });
  }
});

app.get("/api/state", (req, res) => {
  const db = readDatabase();
  res.json(db);
});

app.post("/api/state/reset", (req, res) => {
  writeDatabase(defaultDb);
  res.json({ status: "success", db: defaultDb });
});

app.post("/api/deadlines", (req, res) => {
  const { title, subject, date } = req.body;
  const db = readDatabase();
  const added = {
    id: "dl-server-" + Date.now(),
    title: title || "New Deadline",
    subject: subject || "General Studies",
    date: date || new Date().toISOString().split('T')[0],
    completed: false
  };
  db.deadlines.unshift(added);
  writeDatabase(db);
  res.json({ status: "success", deadline: added, deadlines: db.deadlines });
});

app.post("/api/deadlines/toggle", (req, res) => {
  const { id } = req.body;
  const db = readDatabase();
  db.deadlines = db.deadlines.map(d => {
    if (d.id === id) {
      return { ...d, completed: !d.completed };
    }
    return d;
  });
  writeDatabase(db);
  res.json({ status: "success", deadlines: db.deadlines });
});

app.post("/api/deadlines/delete", (req, res) => {
  const { id } = req.body;
  const db = readDatabase();
  db.deadlines = db.deadlines.filter(d => d.id !== id);
  writeDatabase(db);
  res.json({ status: "success", deadlines: db.deadlines });
});

app.post("/api/study-logs", (req, res) => {
  const { topic, duration, xpGained, comments } = req.body;
  const db = readDatabase();
  const added = {
    id: "log-server-" + Date.now(),
    topic: topic || "Focus Session",
    duration: Number(duration) || 25,
    date: new Date().toISOString().split('T')[0],
    xpGained: Number(xpGained) || 50,
    comments: comments || "Focused study session complete."
  };
  db.studyLogs.unshift(added);
  writeDatabase(db);
  res.json({ status: "success", log: added, studyLogs: db.studyLogs });
});

app.post("/api/scratch-notes", (req, res) => {
  const { notes } = req.body;
  const db = readDatabase();
  db.scratchNotes = notes || "";
  writeDatabase(db);
  res.json({ status: "success", scratchNotes: db.scratchNotes });
});

app.post("/api/leaderboard/submit", (req, res) => {
  const { name, xp, badge } = req.body;
  if (!name) return res.status(400).json({ error: "Scholar Name required" });
  
  const db = readDatabase();
  // check if scholar already exists in list, update or append
  const idx = db.leaderboard.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
  
  if (idx !== -1) {
    if (xp > db.leaderboard[idx].xp) {
      db.leaderboard[idx].xp = xp;
      if (badge) db.leaderboard[idx].badge = badge;
    }
  } else {
    db.leaderboard.push({
      name,
      xp: xp || 150,
      badge: badge || "Rising Leaderboard Contender 🌟"
    });
  }
  
  // sort desc by xp
  db.leaderboard.sort((a, b) => b.xp - a.xp);
  writeDatabase(db);
  res.json({ status: "success", leaderboard: db.leaderboard });
});

app.post("/api/resources", (req, res) => {
  const { title, url, courseSubject, category, notes } = req.body;
  if (!title || !url || !courseSubject || !category) {
    return res.status(400).json({ error: "Missing required resource attributes" });
  }
  const db = readDatabase();
  const newResource = {
    id: "res-server-" + Date.now(),
    title,
    url,
    courseSubject,
    category,
    notes: notes || "",
    isFavorite: false,
    createdAt: new Date().toISOString()
  };
  db.resources.unshift(newResource);
  writeDatabase(db);
  res.json({ status: "success", resource: newResource, resources: db.resources });
});

app.post("/api/resources/toggle-favorite", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "id is required" });
  const db = readDatabase();
  db.resources = db.resources.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r);
  writeDatabase(db);
  res.json({ status: "success", resources: db.resources });
});

app.post("/api/resources/delete", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "id is required" });
  const db = readDatabase();
  db.resources = db.resources.filter(r => r.id !== id);
  writeDatabase(db);
  res.json({ status: "success", resources: db.resources });
});

// Setup Vite & Static Assets serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OK] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

startServer();
