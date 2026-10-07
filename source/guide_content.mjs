// Hand-curated study-guide content for The Epistemic Theater: key positions, predation cases,
// formulas, exam prompts, and rehearsal answers. Lexicon terms, timestamps, and references come
// from the chapter files (beat.cite) and tools/refs.mjs at build time.
const v = (s) => `<i>${s}</i>`;

export const CHAPTERS = {
  aims: {
    ideas: [
      ['Deductive-nomological model', 'Hempel & Oppenheim 1948', 'Explanation is deduction from laws plus conditions; explanation and prediction share one form.'],
      ['Explanatory asymmetry', 'Bromberger 1966', 'The flagpole’s shadow lets you deduce its height but does not explain it.'],
      ['Causal-mechanical explanation', 'Salmon 1984', 'To explain is to show the causal processes and mechanisms that produced the event.'],
      ['Unification', 'Kitcher 1989', 'To explain is to fit many phenomena under few argument patterns.'],
      ['No-miracles argument', 'Putnam 1975', 'Realism is the only view that does not make the success of science a miracle.'],
      ['Pessimistic meta-induction', 'Laudan 1981', 'Many successful theories were false, so success is weak evidence of truth.'],
      ['Constructive empiricism', 'van Fraassen 1980', 'Science aims at empirical adequacy, truth about observables.'],
      ['Structural realism', 'Worrall 1989', 'What survives theory change is mathematical structure.'],
      ['Toulmin model', 'Toulmin 1958', 'Data support a claim through a warrant with backing, a qualifier, and possible rebuttals.'],
    ],
    cases: [
      ['White et al. 2024', 'Northern Range elk', '>19,000 just before 1995; 3,915 in 2013; 7,000–9,000 now.'],
      ['Clark & Hebblewhite 2021', '52 predator-removal experiments', 'Removals often raised juvenile recruitment but rarely adult survival or abundance.'],
      ['Vucetich et al. 2005', 'Northern Range elk, 1961–2004', 'First post-reintroduction decade driven mainly by hunting and drought.'],
    ],
    prompts: [
      'Distinguish explanation from prediction. Give an ecological model that predicts without explaining, and one that explains but predicts poorly.',
      'State the no-miracles argument and the pessimistic meta-induction. Which position do you hold about “predation risk” or “carrying capacity”?',
      'Lay out the claim “wolves caused the Northern Range elk decline” as a Toulmin argument, including a qualifier and a rebuttal.',
    ],
  },
  know: {
    ideas: [
      ['Justified true belief', 'Classical analysis', 'Knowledge as belief that is true and held for good reasons.'],
      ['Gettier problem', 'Gettier 1963', 'Justified true beliefs that are true by luck are not knowledge.'],
      ['Foundationalism vs coherentism', '—', 'Justification rests on basic beliefs, or on mutual support among beliefs.'],
      ['Problem of induction', 'Hume 1748', 'Past experience cannot logically guarantee the future.'],
      ['Fallibilism', 'Peirce 1877', 'Any belief may be wrong; inquiry stays open to correction.'],
      ['Naturalized epistemology', 'Quine 1969', 'Epistemology is continuous with science: the study of how knowers actually learn.'],
      ['Research paradigm', 'Guba & Lincoln 1994, 2005', 'Answers to ontology, epistemology, methodology, and axiology.'],
      ['Positivism; verification principle', 'Comte; Vienna Circle; Ayer 1936', 'Knowledge from observation; meaningful only if verifiable or analytic. Self-undermining.'],
      ['Postpositivism; critical realism', 'Bhaskar 1975', 'A real world, imperfectly known through fallible, probabilistic inquiry.'],
      ['Interpretivism; Verstehen', 'Dilthey 1883; Weber 1922; Taylor 1971', 'Human action is understood through meanings, not only explained by causes.'],
      ['Social construction', 'Berger & Luckmann 1966', 'Many social categories and institutions are created and sustained by people.'],
    ],
    cases: [
      ['Haggerty & Travis 2006', 'Elk on private land outside Yellowstone', 'Tolerance of elk on irrigated fields shaped herd distribution: meanings shape management.'],
      ['Wilmers et al. 2025', 'Social carrying capacity', 'The number of carnivores people tolerate is often below ecological carrying capacity.'],
    ],
    prompts: [
      'Construct an ecological Gettier case of your own and say what it shows about justification.',
      'Compare postpositivism and interpretivism on ontology, epistemology, methodology, and axiology.',
      'Why did the verification principle fail, and what replaced it in practice?',
    ],
  },
  infer: {
    ideas: [
      ['Deduction', '—', 'Truth-preserving, not ampliative. Valid if the conclusion must follow; sound if valid with true premises.'],
      ['Induction', 'Hume 1748', 'Ampliative and fallible; cannot be justified without assuming nature is uniform.'],
      ['Abduction / IBE', 'Peirce 1878; Lipton 2004', 'Infer the hypothesis that would best explain a surprising fact; “loveliest” is not always “likeliest”.'],
      ['Hypothetico-deductive method', '—', 'Deduce observable consequences of a hypothesis and test them.'],
      ['Multiple working hypotheses', 'Chamberlin 1890', 'Hold rivals simultaneously to avoid attachment to one.'],
      ['Strong inference', 'Platt 1964', 'Devise rival hypotheses and crucial experiments that exclude some; iterate.'],
    ],
    cases: [
      ['Leopold 1949', 'Kaibab Plateau deer', 'Deer irruption and range collapse attributed to predator removal.'],
      ['Hairston, Smith & Slobodkin 1960', 'Green world hypothesis', 'The world is green because predators hold herbivores in check.'],
      ['Caughley 1970', 'Kaibab records', 'Data “unreliable and inconsistent”; cattle removal an untested rival.'],
      ['Ford & Goheen 2015', 'Trophic-cascade research', 'Call for strong inference and mechanism.'],
    ],
    prompts: [
      'Classify each step of the Kaibab story as deduction, induction, or abduction, and identify the untested rival.',
      'Derive opposing predictions for fear-mediated versus density-mediated aspen recovery.',
      'What does Platt’s strong inference add to the hypothetico-deductive method?',
    ],
  },
  fals: {
    ideas: [
      ['Logical asymmetry', 'Popper 1959', 'No number of confirmations proves a universal claim; one counterinstance refutes it.'],
      ['Corroboration', 'Popper 1963', 'Survival of severe tests; not proof or probability.'],
      ['Falsifiability as demarcation', 'Popper 1963', 'Science makes risky predictions; theories that explain anything explain nothing.'],
      ['Duhem–Quine thesis', 'Duhem 1906; Quine 1951', 'Hypotheses are tested with auxiliaries, so a failure does not say what is false.'],
      ['Research programmes', 'Lakatos 1970', 'Hard core, protective belt; progressive if adjustments predict novel facts.'],
      ['NHST is not falsification', 'Johnson 1999; Anderson et al. 2000', 'Rejecting a null of no effect is not a risky test of a research hypothesis.'],
    ],
    cases: [
      ['Creel et al. 2007', 'Elk progesterone vs elk:wolf ratio', 'Reported lower progesterone where wolves were relatively more numerous.'],
      ['White et al. 2011; Proffitt et al. 2014', 'Direct pregnancy measurements', 'Pregnancy uniformly high regardless of wolf risk.'],
      ['Middleton et al. 2013', 'GPS-collared elk and wolves', 'Encounters too infrequent to disrupt foraging.'],
      ['Kauffman et al. 2010; Beschta & Ripple 2013', 'Risk and aspen browsing', 'No risk effect found; reply: elk sense risk where they meet wolves, not where wolves kill.'],
    ],
    prompts: [
      'Is the hypothesis that fear lowers elk pregnancy falsified? Identify the auxiliaries and say what Lakatos would ask.',
      'Explain why Neptune and Vulcan illustrate the Duhem–Quine problem.',
      'Why is rejecting a null hypothesis not a Popperian test? What would a severe test of a cascade look like?',
    ],
  },
  kuhn: {
    ideas: [
      ['Normal science; puzzle-solving', 'Kuhn 1962', 'Research within a shared paradigm; anomalies set aside until crisis.'],
      ['Disciplinary matrix; exemplar', 'Kuhn 1970', 'The two senses of paradigm: shared commitments, and model solutions students imitate.'],
      ['Incommensurability; gestalt switch', 'Kuhn 1962', 'Rival paradigms lack a common measure; change resembles seeing the duck–rabbit flip.'],
      ['Theory-choice values', 'Kuhn 1977', 'Accuracy, consistency, scope, simplicity, fruitfulness, weighed differently.'],
      ['Epistemological anarchism', 'Feyerabend 1975', '“Anything goes”: no method survives the history of science intact.'],
      ['Research traditions', 'Laudan 1977', 'Traditions judged by problem-solving success.'],
      ['Balance of nature to patch dynamics', 'Wu & Loucks 1995', 'A candidate paradigm shift in ecology.'],
    ],
    cases: [
      ['Leopold 1949', '“Thinking Like a Mountain”', 'A conversion from predator control to predator appreciation.'],
      ['Estes et al. 1998; Terborgh et al. 2001; Crooks & Soulé 1999', 'Exemplars of top-down control', 'Otters–kelp; predator-free islands; mesopredator release and songbirds.'],
      ['Ripple & Beschta 2003, 2006, 2012', 'Yellowstone cascade', 'Normal science extending the pattern to cottonwood, willow, and aspen.'],
    ],
    prompts: [
      'Is the move from predator control to trophic cascades a Kuhnian revolution? Use exemplars and anomalies in your answer.',
      'Distinguish Kuhn’s paradigm from a research paradigm in Guba and Lincoln’s sense.',
      'How can theory choice be rational if paradigms are incommensurable?',
    ],
  },
  obs: {
    ideas: [
      ['Theory-ladenness; seeing-as', 'Hanson 1958', 'What is observed depends on concepts brought to it (Tycho and Kepler at dawn).'],
      ['Data vs phenomena', 'Bogen & Woodward 1988', 'Theories explain stable phenomena inferred from data, not the data themselves.'],
      ['Triangulation', 'Hacking 1983', 'Agreement among independent methods built on different theories.'],
      ['Imperfect detection', 'MacKenzie et al. 2002', 'Counts confound abundance with detection; non-detection ≠ absence.'],
      ['Reflexivity', 'Interpretive research', 'Declaring the researcher’s position because it shapes what is noticed.'],
    ],
    equations: [
      ['Expected count', `E[${v('C')}] = ${v('N')} · ${v('p')} &nbsp;(abundance × detection probability)`],
      ['Occupancy, one site', `P(detected at least once in ${v('K')} surveys) = ψ[1 − (1 − ${v('p')})<sup>${v('K')}</sup>]`],
    ],
    cases: [
      ['Ripple & Beschta 2007', 'Five tallest aspen per stand', 'Designed to detect early recovery among the leading stems.'],
      ['Painter et al. 2015', 'Random plots and the five tallest stems, 2012', 'Up to 65% of stands had a sapling above 200 cm; the range-wide inference rested largely on the random samples.'],
      ['Kauffman et al. 2010', 'All young aspen in random plots', 'No difference with predation risk.'],
      ['Brice et al. 2022, 2024', 'Both designs on the same stands', 'Both detect a cascade; tallest stems show whether, random samples show how strong.'],
      ['Hobbs et al. 2024', 'Willow sampling', 'Studies at well-watered sites overstated recovery.'],
      ['Kohl et al. 2018, 2019', 'GPS on elk, wolves, pumas', 'Diel landscape of fear invisible to sparse VHF data.'],
    ],
    prompts: [
      'Explain how the tallest-stem and random-plot designs each embody a question, and which question each can answer.',
      'Give three operational definitions of “predation risk” and the theory each carries.',
      'Does theory-ladenness mean anything goes? Answer with Hacking’s triangulation.',
    ],
  },
  models: {
    ideas: [
      ['All models are wrong', 'Box 1976', 'Models are useful because they omit; the question is whether they are wrong in ways that matter.'],
      ['Three kinds of idealization', 'Weisberg 2007', 'Galilean (tractability), minimalist (difference-makers), multiple-models.'],
      ['Models as mediators', 'Morgan & Morrison 1999', 'Partly independent of theory and world, so they can teach about both.'],
      ['Generality, realism, precision', 'Levins 1966', 'No model maximizes all three; robustness analysis across models.'],
      ['Estimand vs estimate', '—', 'The quantity of interest versus the model output; the link is an assumption.'],
    ],
    cases: [
      ['Metz et al. 2020', 'Pumas vs wolves, 1998–2004', 'Pumas killed a larger share of Northern Range elk than wolves in most years.'],
      ['Barber-Meyer et al. 2008', 'Elk calves', 'Bears were the main predators of calves.'],
      ['Ripple et al. 2025 vs a critique cited in Wilmers et al. 2025', 'Willow crown volume', '+1,500% estimate vs concern that the volume model was calibrated on lightly browsed plants.'],
      ['Messier 1994; National Research Council 1997', 'Predator pit', 'Little support for alternative stable states in wolf–moose systems.'],
    ],
    prompts: [
      'What is wrong, and what is right, about the three-box wolf–elk–aspen cascade?',
      'Explain extrapolation using the willow crown-volume dispute.',
      'How did the predator-pit model act in the world, and what did tests find?',
    ],
  },
  cause: {
    ideas: [
      ['Confounding; reverse causation; collider bias', '—', 'Three non-causal sources of association.'],
      ['Simpson’s paradox', '—', 'Subgroup trends reverse when pooled; resolving it needs a causal model.'],
      ['Regularity, counterfactual, interventionist', 'Hume 1748; Lewis 1973; Woodward 2003', 'Three accounts of what a cause is.'],
      ['Potential outcomes', 'Rubin 1974; Holland 1986', 'Each unit has outcomes with and without treatment; only one is observed.'],
      ['DAGs; back-door criterion; ladder', 'Pearl 2009; Pearl & Mackenzie 2018', 'Block non-causal paths; association, intervention, counterfactuals.'],
      ['Randomization; factorial designs', 'Fisher 1935', 'Balance confounders in expectation; reveal interactions.'],
      ['BACI; Hill’s viewpoints', 'Stewart-Oaten et al. 1986; Hill 1965', 'Weighing observational evidence when experiments are impossible.'],
    ],
    equations: [
      ['Individual causal effect', `τ<sub>${v('i')}</sub> = ${v('Y')}<sub>${v('i')}</sub>(1) − ${v('Y')}<sub>${v('i')}</sub>(0) &nbsp;(never observed directly)`],
      ['Average causal effect', `ATE = E[${v('Y')}(1)] − E[${v('Y')}(0)], identified by randomization`],
      ['Back-door adjustment', `P(${v('y')} | do(${v('x')})) = Σ<sub>${v('z')}</sub> P(${v('y')} | ${v('x')}, ${v('z')}) P(${v('z')})`],
    ],
    cases: [
      ['Brodie et al. 2013', '45 elk populations', 'Higher survival with both pumas and wolves, most likely because hunting quotas were cut; harvest dominated.'],
      ['MacNulty et al. 2020', 'Ages of killed cow elk', 'Wolf kills modally ~16 years old; hunter kills ~4: compensatory vs additive.'],
      ['Ford & Goheen 2015; Wilmers et al. 2025', 'Three causal links of a cascade', 'Herbivory–plants established by exclosures; predators–herbivores least certain; net effect mixed.'],
      ['Bilyeu et al. 2008; Hobbs et al. 2024', 'Dams × exclosures', 'Together, willows passed browse height in ~5 years; controls never did.'],
      ['Hurley et al. 2011; Bishop et al. 2009', 'Mule deer', 'Predator removal barely changed growth; winter feeding raised it 13% per year.'],
      ['Wilmers et al. 2006', 'Isle Royale parvovirus', 'Wolf crash as a natural experiment; moose grew faster and higher.'],
    ],
    prompts: [
      'Draw a DAG for the Northern Range and identify a back-door path between wolves and elk survival.',
      'Why is compensatory mortality a counterfactual claim? What evidence bears on it?',
      'Design a study that separates top-down from bottom-up limitation of a deer population.',
    ],
  },
  under: {
    ideas: [
      ['Underdetermination', 'Duhem 1906; Quine 1951', 'Evidence may not fix which theory is true.'],
      ['Transient vs strong', '—', 'Resolvable by further evidence, or empirically equivalent forever.'],
      ['Equifinality', 'Beven & Freer 2001', 'Many parameter sets fit the same record.'],
      ['Pattern–process problem', 'Levin 1992', 'Different processes generate the same pattern.'],
      ['Multimodel inference', 'Burnham & Anderson 2002', 'Rank and average candidate models by information criteria.'],
      ['Scale dependence', 'Prugh & Sivy 2020; Sivy et al. 2017', 'Positive associations locally, negative across landscapes.'],
    ],
    equations: [
      ['AIC', `AIC = −2 ln ${v('L')} + 2${v('k')}; &nbsp; Δ<sub>${v('i')}</sub> = AIC<sub>${v('i')}</sub> − AIC<sub>min</sub>`],
      ['Akaike weight', `${v('w')}<sub>${v('i')}</sub> = exp(−Δ<sub>${v('i')}</sub>/2) / Σ<sub>${v('j')}</sub> exp(−Δ<sub>${v('j')}</sub>/2)`],
    ],
    cases: [
      ['Vucetich et al. 2005', 'Elk decline, first decade', 'Hunting and drought; no comparable apportionment since.'],
      ['MacNulty et al. 2020', 'Winter range outside the park (20% → 80%)', 'Demographic, not behavioural: survival was higher outside.'],
      ['Brice et al. 2024', 'Aspen recruitment', 'Risk effects 8–28 times weaker than density effects.'],
      ['Hobbs et al. 2024 vs Ripple et al. 2025', 'Willow', 'Stalled system (possible alternative stable state) vs slow recovery, from the same data.'],
    ],
    prompts: [
      'Which parts of the Northern Range story show transient underdetermination that has been resolved, and which remain open?',
      'Explain how scale can make two contradictory carnivore studies both correct.',
      'What does multimodel inference do that a single best model does not?',
    ],
  },
  bayes: {
    ideas: [
      ['Credence; Dutch book', 'Ramsey 1926', 'Degrees of belief should obey probability, or a set of bets loses for sure.'],
      ['Conditionalization; confirmation', '—', 'Update to P(H | E); evidence confirms by raising probability.'],
      ['Likelihood ratio', 'Royall 1997', 'The strength of evidence; Royall’s three questions: evidence, belief, action.'],
      ['Base-rate fallacy', '—', 'Ignoring how rare the hypothesis is.'],
      ['Washing out of priors', '—', 'Different reasonable priors converge with enough shared data.'],
      ['Severe testing', 'Mayo 2018', 'Support only when a claim passed a test it would likely have failed if false.'],
    ],
    equations: [
      ['Bayes’ theorem', `P(${v('H')} | ${v('E')}) = P(${v('E')} | ${v('H')}) P(${v('H')}) / P(${v('E')})`],
      ['Odds form', `posterior odds = likelihood ratio × prior odds; &nbsp; LR = P(${v('E')} | ${v('H')}<sub>1</sub>) / P(${v('E')} | ${v('H')}<sub>2</sub>)`],
      ['Camera-trap example (illustrative)', `P(wolf | flag) = (0.95 × 0.001) / (0.95 × 0.001 + 0.01 × 0.999) ≈ 0.087`],
      ['Flat-prior reading of a CI (illustrative)', `SE ≈ (0.05 + 0.41)/3.92 ≈ 0.117; &nbsp; P(effect &lt; 0) ≈ Φ(0.18/0.117) ≈ 0.94`],
    ],
    cases: [
      ['McLaren & Peterson 1994', 'Isle Royale tree rings', 'Fir growth tracked wolves and moose: a prior for cascades.'],
      ['Kauffman 2010 → Hobbs 2024', 'Yellowstone studies in sequence', 'Belief in some aspen cascade survived; belief that fear drives it fell.'],
      ['Wilmers et al. 2025', '16 large carnivore–mesocarnivore pairs', 'Mean correlation −0.18 (95% CI −0.41 to 0.05; p = 0.11).'],
    ],
    prompts: [
      'Work the camera-trap base-rate example and explain why most flagged “wolves” are coyotes.',
      'What does a non-significant result with interval −0.41 to 0.05 not show? Answer in Bayesian and in error-statistical terms.',
      'How should a prior for the strength of the Yellowstone cascade change across the studies in this chapter?',
    ],
  },
  rep: {
    ideas: [
      ['Reproducibility; replicability', 'National Academies 2019', 'Same data and code vs new data; plus generalizability and robustness.'],
      ['Many analysts', 'Silberzahn et al. 2018', '29 teams, one data set, estimates from slightly negative to strongly positive.'],
      ['Replication crisis', 'Ioannidis 2005; Open Science Collaboration 2015', '97% of originals significant; 36% of replications.'],
      ['P-hacking; HARKing; forking paths', 'Kerr 1998; Gelman & Loken 2014', 'Flexible analysis inflates false positives.'],
      ['Pseudoreplication', 'Hurlbert 1984', 'Non-independent measurements treated as replicates.'],
      ['Preregistration; transferability', 'Nosek et al. 2018; Yates et al. 2018', 'Fix plans before data; test models in new places.'],
      ['Trustworthiness criteria', 'Lincoln & Guba 1985', 'Credibility, transferability, dependability, confirmability.'],
    ],
    cases: [
      ['Garrott et al. 2008', 'Madison Headwaters elk', 'Cow survival down 5–15%; numbers down 5- to 10-fold.'],
      ['Klein 1995; Roffler et al. 2023', 'Coronation and Pleasant islands', 'Wolves nearly eliminated deer.'],
      ['Griffin et al. 2011', '11 elk populations, neonates', 'Only grizzly predation additive.'],
      ['Brodie et al. 2013', '45 populations, adult females', 'Human harvest dominated.'],
      ['Prugh & Sivy 2020; Wilmers et al. 2025', 'Where studies are vs where carnivores live', '~70% of interaction studies in protected areas; 15% of range protected, 4% strictly.'],
    ],
    prompts: [
      'Distinguish reproducibility, replicability, generalizability, and robustness with one ecological example each.',
      'Why did wolves limit elk in the Madison Headwaters but not clearly on the Northern Range? State the scope conditions.',
      'What does the mismatch between where carnivore studies occur and where carnivores live imply for external validity?',
    ],
  },
  values: {
    ideas: [
      ['Value-free ideal; discovery vs justification', 'Reichenbach 1938', 'Values may guide questions and uses, not the weighing of evidence.'],
      ['Argument from inductive risk', 'Rudner 1953; Douglas 2000, 2009', 'How much evidence is enough depends on the cost of error.'],
      ['Epistemic vs non-epistemic values', 'Douglas 2009', 'Non-epistemic values may set thresholds but never substitute for evidence.'],
      ['CUDOS norms', 'Merton 1942', 'Communalism, universalism, disinterestedness, organized skepticism.'],
      ['Transformative criticism', 'Longino 1990', 'Objectivity as a property of critical communities.'],
      ['Strong objectivity', 'Harding 1991', 'Starting from marginalized standpoints exposes hidden assumptions.'],
      ['Crisis discipline', 'Soulé 1985', 'Conservation must act before evidence is complete; its goals are values.'],
    ],
    cases: [
      ['Lamb et al. 2024; Serrouya et al. 2021', 'Mountain caribou', '−51% (1991–2023); 15 of 41 subpopulations functionally extirpated; apparent competition.'],
      ['Raynor et al. 2021', 'Wolves in Wisconsin', 'Deer–vehicle collisions −24%; benefits ≈ 63× livestock losses.'],
      ['Gilbert et al. 2017', 'Puma recovery, eastern US', 'Projected 155 human deaths averted over 30 years.'],
      ['Wilmers et al. 2025', 'Baselines', 'Disagreement over recovery partly reflects pre-European vs pre-Indigenous baselines.'],
    ],
    prompts: [
      'Apply the argument from inductive risk to a decision to cull wolves for caribou.',
      'Which values enter when choosing an ecological baseline for “recovery”?',
      'Explain how the Yellowstone debate illustrates objectivity as a social achievement.',
    ],
  },
  demarc: {
    ideas: [
      ['Verifiability; falsifiability', 'Ayer 1936; Popper 1959', 'Early criteria; each fails as necessary and sufficient.'],
      ['Puzzle-solving; progress', 'Kuhn 1962; Lakatos 1970', 'Criteria based on traditions and programmes.'],
      ['Stagnation test', 'Thagard 1978', 'Pseudoscience stagnates while rivals progress, and its practitioners ignore that.'],
      ['Methodological naturalism', 'McLean 1982; Kitzmiller 2005', 'The working rule courts applied to creationism and intelligent design.'],
      ['Daubert standard', 'Daubert 1993', 'Testability, peer review, error rates, standards, general acceptance.'],
      ['Demise of demarcation', 'Laudan 1983', 'No necessary and sufficient conditions survive.'],
      ['Cluster concept; systematicity', 'Pigliucci & Boudry 2013; Hoyningen-Huene 2013', 'Looser revivals; science as more systematic knowledge.'],
      ['Wissenschaft', '—', 'German for all systematic knowledge, humanities included.'],
    ],
    cases: [
      ['Leopold 1949 → Caughley 1970', 'The Kaibab story, revisited', 'A weakly tested account lived in textbooks until criticism corrected it: demarcation concerns practices.'],
    ],
    prompts: [
      'Apply three demarcation criteria to postpositivist ecology, interpretive human-dimensions research, and astrology. Where do the answers differ?',
      'Is the label “science” a definitional choice? What follows from choosing a narrow or a broad definition?',
      'Why does the Kaibab story matter for demarcation?',
    ],
  },
  syn: {
    audit: [
      'What was observed, and how?',
      'What was inferred, under which assumptions?',
      'Which alternatives remain?',
      'How strong is the evidence, and what would change your mind?',
      'Has it been replicated, and where does it generalize?',
      'Which values and stakes shape the claim?',
      'What would another tradition of inquiry ask that this one did not?',
    ],
    answers: [
      ['What separates induction from abduction, and where does strong inference fit?', 'Induction generalizes from observed cases to unobserved ones; abduction infers the hypothesis that would best explain a surprising fact. Strong inference disciplines abduction by generating rival explanations and designing tests that exclude some, so the loveliest story must also survive elimination.'],
      ['Why does the Duhem–Quine thesis complicate falsification?', 'A prediction follows from a hypothesis plus auxiliary assumptions, so a failed prediction refutes only the conjunction. Logic cannot say whether the hypothesis or an auxiliary (an index, an instrument, a measure of risk) is at fault; Lakatos asks whether rescuing adjustments predict novel facts.'],
      ['What did Kuhn mean by incommensurability?', 'Rival paradigms differ in problems, standards, and meanings of terms, so there is no neutral measure by which a single test decides between them; choice relies on shared values weighed by judgment.'],
      ['Why is compensatory mortality a counterfactual claim?', 'It asserts that animals killed by a predator would have died anyway from other causes: a claim about an unobserved outcome. Evidence such as the age and condition of killed animals (wolf-killed cow elk ~16 years, hunter-killed ~4) bears on it indirectly.'],
      ['What is the argument from inductive risk?', 'Because evidence never makes a hypothesis certain, accepting it requires judging the evidence sufficient, and sufficiency depends on the costs of false acceptance and false rejection. Non-epistemic values therefore legitimately set evidential thresholds (Rudner; Douglas), though they must not replace evidence.'],
      ['How does the answer to “what counts as science?” change with the criterion?', 'Under falsifiability even astrology qualifies; under institutional norms and progress interpretive research qualifies and astrology does not; under cluster, systematicity, or Wissenschaft accounts both research traditions qualify. The practices do not change; the label does.'],
    ],
  },
};
