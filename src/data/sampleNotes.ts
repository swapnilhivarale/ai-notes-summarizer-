export interface SampleNote {
  id: string;
  title: string;
  subject: string;
  category: string;
  fileName: string;
  content: string;
}

export const SAMPLE_STUDY_NOTES: SampleNote[] = [
  {
    id: 'biology-photosynthesis',
    title: 'Cellular Respiration & Photosynthesis',
    subject: 'AP Biology / General Bio',
    category: 'Life Sciences',
    fileName: 'Bio_Lecture_Photosynthesis_Energy.txt',
    content: `# Chapter 8: Cellular Respiration and Photosynthesis

## 1. Core Definitions & Principles
- **Photosynthesis**: The biological process by which autotrophic organisms (plants, algae, cyanobacteria) convert light energy into chemical energy stored in glucose ($C_6H_{12}O_6$).
- **Overall Equation for Photosynthesis**:
  6 CO₂ + 6 H₂O + Light Energy → C₆H₁₂O₆ + 6 O₂
- **Cellular Respiration**: The catabolic pathway by which all aerobic cells break down glucose in the presence of oxygen to synthesize Adenosine Triphosphate (ATP).
- **Overall Equation for Cellular Respiration**:
  C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + ~30-32 ATP

## 2. Key Stages of Photosynthesis
1. **Light-Dependent Reactions (Thylakoid Membrane)**:
   - Photons strike Photosystem II (P680) and Photosystem I (P700).
   - Water molecules undergo photolysis: 2 H₂O → 4 H⁺ + 4 e⁻ + O₂ (releasing oxygen byproduct).
   - High-energy electrons generate a proton gradient across the thylakoid lumen, driving ATP Synthase (Photophosphorylation) and reducing NADP⁺ to NADPH.
2. **Calvin Cycle / Light-Independent Reactions (Stroma)**:
   - **Carbon Fixation**: Enzyme RuBisCO fixes CO₂ onto 5-carbon Ribulose-1,5-bisphosphate (RuBP) to produce 3-Phosphoglycerate (3-PGA).
   - **Reduction Phase**: ATP and NADPH reduce 3-PGA into Glyceraldehyde-3-phosphate (G3P).
   - **Regeneration**: RuBP is regenerated using ATP. 2 molecules of G3P exit the cycle to form 1 molecule of glucose.

## 3. Key Stages of Cellular Respiration
1. **Glycolysis (Cytosol)**:
   - Anaerobic stage. 1 Glucose (6C) is split into 2 Pyruvate (3C).
   - Net yield: 2 ATP (via substrate-level phosphorylation) and 2 NADH.
2. **Pyruvate Oxidation & Citric Acid / Krebs Cycle (Mitochondrial Matrix)**:
   - Pyruvate is converted to Acetyl-CoA, releasing CO₂ and 1 NADH.
   - Acetyl-CoA combines with Oxaloacetate to form Citrate. Yields per glucose: 2 ATP, 6 NADH, 2 FADH₂, 4 CO₂.
3. **Oxidative Phosphorylation (Inner Mitochondrial Membrane)**:
   - Electron Transport Chain (ETC): NADH and FADH₂ donate electrons to protein complexes (I, II, III, IV).
   - Terminal electron acceptor is Oxygen (O₂), which combines with protons to form H₂O.
   - Chemiosmosis via ATP Synthase produces approximately 26-28 ATP.

## 4. Key Contrasts & Exam Pitfalls
- Plants perform BOTH photosynthesis (in chloroplasts) during daytime and cellular respiration (in mitochondria) continuously day and night.
- RuBisCO is the most abundant protein on Earth, but can also bind O₂ instead of CO₂ causing wasteful photorespiration in C3 plants.
- Cyanide inhibits Cytochrome c Oxidase (Complex IV), halting the electron transport chain and stopping ATP synthesis.`,
  },
  {
    id: 'cs-os-memory',
    title: 'Operating Systems: Virtual Memory & Concurrency',
    subject: 'Computer Science',
    category: 'Engineering',
    fileName: 'CS301_Virtual_Memory_Deadlocks.txt',
    content: `# CS 301: Operating Systems & Systems Programming
## Lecture 14: Virtual Memory, Paging, and Concurrency Controls

### 1. Virtual Memory Architecture
- **Virtual Address Space**: An abstraction provided by the OS and Memory Management Unit (MMU) giving each process the illusion of a large, contiguous dedicated address space.
- **Paging**: Physical memory is partitioned into fixed-size frames (commonly 4KB), while virtual address space is divided into pages of identical size.
- **Page Table**: Translates virtual page numbers (VPN) to physical frame numbers (PFN).
- **Translation Lookaside Buffer (TLB)**: A high-speed hardware cache of recent page table translations.
  - A TLB Hit incurs negligible latency (< 1ns).
  - A TLB Miss requires a page table walk in DRAM (10-50ns).
- **Page Fault**: An interrupt generated when an accessed virtual page is not present in physical RAM (present bit = 0), forcing the OS kernel to retrieve the page from disk swap space.

### 2. Page Replacement Algorithms
- **Optimal (OPT / Belady's Algorithm)**: Evict the page that will not be used for the longest period in the future. Theoretical upper bound benchmark.
- **Least Recently Used (LRU)**: Evicts the page unused for the longest past interval. Approximates OPT well but requires hardware timestamp/list tracking.
- **Clock / Second Chance Algorithm**: Uses a reference bit per page. Circular scanning sets reference bit from 1 to 0; first page with reference bit 0 is evicted.

### 3. Concurrency, Race Conditions, and Synchronization
- **Critical Section**: A block of code accessing shared resources that must not be executed concurrently by more than one thread.
- **Mutual Exclusion (Mutex)**: A locking mechanism ensuring only one thread enters the critical section at a time.
- **Deadlock**: A permanent blocking condition where a set of processes are blocked because each process is holding a resource and waiting for another held by another process.
- **Coffman's Four Necessary Conditions for Deadlock**:
  1. *Mutual Exclusion*: Resources cannot be shared simultaneously.
  2. *Hold and Wait*: A process holds resources while requesting new ones.
  3. *No Preemption*: Resources cannot be forcibly revoked from a holding process.
  4. *Circular Wait*: A circular chain of processes exists where each process waits for a resource held by the next.
- **Deadlock Prevention**: Eliminate at least one of the four Coffman conditions (e.g., enforce strict global resource ordering to break circular wait).`,
  },
  {
    id: 'history-renaissance',
    title: 'European Renaissance & Scientific Revolution',
    subject: 'World History',
    category: 'Humanities',
    fileName: 'History_Notes_Renaissance_Science.txt',
    content: `# History of Western Civilization: The Renaissance & Scientific Revolution (14th - 17th Centuries)

## 1. Foundations of the Italian Renaissance
- **Origins**: Emerged in Florence, Venice, and Milan during the early 14th century (c. 1350-1600), fueled by Mediterranean maritime trade wealth (notably the Medici banking dynasty in Florence).
- **Humanism**: Intellectual movement founded by Francesco Petrarch (1304–1374), emphasizing classical Greek and Roman texts, secular individualism, rhetoric, grammar, and moral philosophy rather than strictly scholastic theological dogma.
- **Printing Revolution (c. 1440-1450)**: Johannes Gutenberg invented the movable type printing press in Mainz, Germany. This drastically lowered the cost of books, increased literacy rates across Europe, and accelerated the dissemination of humanist ideas.

## 2. Key Cultural and Artistic Innovations
- **Linear Perspective**: Formulated mathematically by Filippo Brunelleschi and Leon Battista Alberti, allowing two-dimensional surfaces to portray convincing geometric depth and spatial realism.
- **Prominent Figures**:
  - *Leonardo da Vinci (1452–1519)*: Exemplar of the "Renaissance Polymath," renowned for the Mona Lisa, The Last Supper, and anatomical studies.
  - *Michelangelo Buonarroti (1475–1564)*: Sculptor of David and painter of the Sistine Chapel ceiling in Rome.
  - *Niccolò Machiavelli (1469–1527)*: Authored *The Prince* (1513), establishing modern political realism through the thesis that political survival justifies pragmatic power calculations ("the ends justify the means").

## 3. The Scientific Revolution (1543–1687)
- **Shift from Geocentrism to Heliocentrism**:
  - *Nicolaus Copernicus*: Published *De revolutionibus orbium coelestium* in 1543, positing that the Earth and planets revolve around the stationary Sun.
  - *Johannes Kepler (1571–1630)*: Derived Three Laws of Planetary Motion, proving planetary orbits are elliptical rather than circular.
  - *Galileo Galilei (1564–1642)*: Used an improved astronomical telescope in 1609 to discover Jupiter's 4 moons (Moons of Galileo), lunar craters, and sunspots, disproving Aristotelian celestial perfection. Tried by the Roman Inquisition in 1633.
- **Empirical Scientific Method**:
  - *Francis Bacon (1561–1626)*: Advocated inductive reasoning and empirical experimentation in *Novum Organum* (1620).
  - *René Descartes (1596–1650)*: Championed deductive rationalism ("Cogito, ergo sum" / "I think, therefore I am").
  - *Sir Isaac Newton (1642–1727)*: Published *Philosophiae Naturalis Principia Mathematica* in 1687, formulating the Universal Law of Gravitation and Three Laws of Motion, unifying terrestrial and celestial mechanics.`,
  },
];
