// Knowledge base content. Each topic has both a "simple" explanation and a
// "scientific" one. Content is written in plain Markdown-ish text; the page
// renders it with a tiny renderer (paragraphs, bullet lists, headings).
//
// Structure of a topic:
//   id, title, category, summary, icon (string key), diagram (string key),
//   keywords[], simple (string), science (string), faq: [{q, a}]
//
// Icons reference lucide-react names. Diagrams reference exported names in
// src/components/knowledge/Diagrams.jsx.
//
// All content is educational, not medical advice.

export const CATEGORIES = [
  { id: 'basics',     label: 'GLP-1 Basics' },
  { id: 'glucose',    label: 'Blood Sugar' },
  { id: 'nutrition',  label: 'Nutrition' },
  { id: 'lifestyle',  label: 'Lifestyle' },
  { id: 'safety',     label: 'Safety' },
]

export const TOPICS = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'what-are-glp1s',
    title: 'What are GLP-1s and how do they work?',
    category: 'basics',
    icon: 'Syringe',
    diagram: 'GLP1MechanismDiagram',
    summary: 'GLP-1 medications (Ozempic, Wegovy, Mounjaro, Zepbound) mimic a gut hormone that controls hunger, insulin, and stomach emptying.',
    keywords: ['glp-1','glp1','ozempic','wegovy','mounjaro','zepbound','semaglutide','tirzepatide','liraglutide','saxenda','victoza','incretin','agonist','how it works'],
    simple: `
GLP-1 is a hormone your gut already makes every time you eat. It tells your body three things at once:

- **"You've eaten — make some insulin."** Insulin lets your cells pull sugar out of your blood.
- **"Slow down the stomach."** Food stays in your stomach longer, so you feel full.
- **"Tell the brain we're full."** Hunger signals quiet down.

GLP-1 **medications** (like Ozempic, Wegovy, Mounjaro, and Zepbound) are long-acting copies of this hormone. Your natural GLP-1 is gone within minutes; the injected version lasts about a week.

The result: you get hungry less, eat smaller portions, and your blood sugar stays steadier after meals.

**Common names**
- **Semaglutide** — Ozempic (diabetes), Wegovy (weight), Rybelsus (pill)
- **Tirzepatide** — Mounjaro (diabetes), Zepbound (weight). Also hits a second hormone called GIP.
- **Liraglutide** — Victoza, Saxenda (daily shot)
- **Dulaglutide** — Trulicity (weekly)
`,
    science: `
GLP-1 (glucagon-like peptide-1) is an **incretin** hormone secreted by intestinal L-cells in response to nutrient intake, primarily carbohydrate and fat. Native GLP-1 has a half-life of ~1–2 minutes due to rapid degradation by DPP-4 (dipeptidyl peptidase-4).

**Mechanism of action**
- **Pancreatic β-cells:** glucose-dependent potentiation of insulin secretion via cAMP/PKA signaling. "Glucose-dependent" is key — insulin release stops when glucose falls to euglycemia, which is why GLP-1 monotherapy rarely causes hypoglycemia.
- **Pancreatic α-cells:** suppression of glucagon, reducing hepatic gluconeogenesis.
- **Gastric motility:** delayed gastric emptying via vagal afferent pathways — attenuates postprandial glucose excursion and prolongs satiety.
- **CNS (hypothalamic arcuate nucleus, brainstem):** reduced appetite and food-reward signaling.

**Pharmacologic GLP-1 receptor agonists (GLP-1RAs)** are engineered to resist DPP-4 degradation and albumin-bind for extended half-life:
- **Semaglutide** — half-life ~1 week; Ozempic (T2DM), Wegovy (obesity), Rybelsus (oral formulation with SNAC absorption enhancer).
- **Tirzepatide** — dual GIP/GLP-1 agonist; half-life ~5 days; Mounjaro (T2DM), Zepbound (obesity). GIP co-agonism appears to potentiate weight loss and glycemic control.
- **Liraglutide** — half-life ~13 h, daily dosing; Victoza, Saxenda.
- **Dulaglutide** — Fc-fused GLP-1 analog, weekly; Trulicity.
- **Exenatide** — twice-daily or weekly extended-release.

**Efficacy**
- HbA1c reduction: ~1.0–2.0% typical in T2DM trials (higher with tirzepatide).
- Weight loss: ~5–15% of baseline body weight at 52–68 weeks (STEP, SURMOUNT trials).
- Cardiovascular outcomes: MACE reduction demonstrated for liraglutide (LEADER), semaglutide (SUSTAIN-6, SELECT), dulaglutide (REWIND), and others.
`,
    faq: [
      { q: 'How fast does it work?', a: 'Appetite suppression often starts within the first week. Meaningful blood-sugar and weight changes usually take 4–12 weeks as doses are gradually increased (titrated).' },
      { q: 'Why does my doctor increase the dose slowly?', a: 'The GI side effects (nausea, constipation) are dose-related. Slow titration lets your stomach adapt.' },
      { q: 'Do I have to take it forever?', a: 'For weight loss, studies show most people regain weight when they stop. It\'s a long-term therapy the same way blood-pressure medication is. Talk to your provider.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'what-is-glucose',
    title: 'What is glucose?',
    category: 'glucose',
    icon: 'Droplets',
    diagram: 'CarbAbsorptionDiagram',
    summary: 'Glucose is the simple sugar your body uses for fuel. Blood glucose is how much is circulating in your bloodstream at any moment.',
    keywords: ['glucose','blood sugar','mg/dl','mmol/l','fasting','postprandial','hyperglycemia','hypoglycemia','fuel','energy','carbohydrate'],
    simple: `
Glucose is the simplest sugar. It's the fuel every cell in your body — especially your brain — runs on.

**Where it comes from**
- Carbs in food break down into glucose.
- Your liver can also make glucose (mostly overnight and between meals).

**Where it goes**
- **Muscles and brain** burn it for energy right now.
- **Liver and muscles** store a short-term supply as **glycogen**.
- **Fat cells** store the extra as fat when there's too much.

**How it moves**
Insulin is the "key" that unlocks your cells so glucose can come inside. Without insulin (Type 1) or with cells that ignore insulin (Type 2), glucose stays stuck in the bloodstream and rises too high.

**Typical numbers (mg/dL)**
- **70–99** fasting — normal
- **100–125** fasting — prediabetes
- **126+** fasting on two occasions — diabetes range
- **<140** two hours after a meal — normal
- **<70** — low (hypoglycemia); most people feel shaky or dizzy below this
- **>180** after a meal, or sustained — high (hyperglycemia)

Outside the US, glucose is often reported in **mmol/L**. Divide mg/dL by 18 to get mmol/L. (140 mg/dL ≈ 7.8 mmol/L.)
`,
    science: `
Glucose (C₆H₁₂O₆) is a six-carbon aldohexose and the primary circulating monosaccharide in humans. Plasma glucose is tightly regulated — typically 70–100 mg/dL (3.9–5.5 mmol/L) in the fasting state — through interplay of insulin, glucagon, cortisol, epinephrine, and growth hormone.

**Sources**
- **Exogenous:** dietary carbohydrate, digested to monosaccharides by α-amylase (salivary and pancreatic) and brush-border disaccharidases (sucrase-isomaltase, lactase, maltase).
- **Endogenous:** hepatic glycogenolysis (breakdown of stored glycogen, ~75 g available) and gluconeogenesis (synthesis from lactate, glycerol, and glucogenic amino acids).

**Cellular uptake**
- **GLUT1:** ubiquitous, insulin-independent — RBCs, BBB.
- **GLUT2:** liver, pancreatic β-cells, intestinal basolateral — high Km, functions as a glucose sensor.
- **GLUT3:** neurons — low Km, high affinity.
- **GLUT4:** skeletal muscle, cardiac muscle, adipose — **insulin-dependent** translocation to the membrane. This is the principal pathway affected in insulin resistance.

**Clinical thresholds (ADA)**
- Normal fasting plasma glucose (FPG): <100 mg/dL.
- Impaired fasting glucose (IFG): 100–125 mg/dL.
- Diabetes: FPG ≥126 mg/dL on two occasions, or 2-h OGTT ≥200 mg/dL, or random ≥200 with symptoms, or HbA1c ≥6.5%.
- Hypoglycemia: <70 mg/dL (level 1), <54 mg/dL (level 2, clinically significant).

**Measurement**
- Capillary fingerstick: plasma-calibrated; reasonable correlation with venous.
- CGM (continuous glucose monitor): interstitial fluid; 5–15 minute lag behind blood glucose during rapid changes.
- A1C: integrates ~2–3 months of glycation (see separate topic).
`,
    faq: [
      { q: 'Is glucose the same as sugar?', a: 'All glucose is sugar, but not all sugar is glucose. Table sugar (sucrose) is glucose + fructose. Milk sugar (lactose) is glucose + galactose. Fruit sugar (fructose) behaves differently in the body — it doesn\'t spike blood glucose directly, but high doses stress the liver.' },
      { q: 'Why does my brain feel bad when my sugar is low?', a: 'Your brain is almost entirely glucose-powered and can\'t store much. When blood glucose drops below ~70, the brain complains: shakiness, irritability, poor focus, sweating.' },
      { q: 'What\'s a "normal" glucose during the day?', a: 'Most non-diabetic adults stay between ~70 and ~140 mg/dL at all times, with a brief bump after meals. On a CGM, healthy adults often spend 90%+ of the day in that range.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'what-is-a1c',
    title: 'What is A1C?',
    category: 'glucose',
    icon: 'Activity',
    diagram: 'A1CDiagram',
    summary: 'A1C is your average blood sugar over ~3 months, measured as the percentage of red blood cells coated with glucose.',
    keywords: ['a1c','hba1c','hemoglobin','glycation','average','3 month','diabetes','eag'],
    simple: `
A1C (also called HbA1c or "glycated hemoglobin") is a **3-month blood-sugar average**.

Here's the trick: when glucose is floating in your blood, some of it sticks to the hemoglobin inside red blood cells. That sticking is permanent for that cell's life. Red blood cells live about 3 months.

So a lab can count what % of your red blood cells have sugar stuck to them and tell you — roughly — what your average glucose has been.

**What the numbers mean**
- **Below 5.7%** — normal
- **5.7–6.4%** — prediabetes
- **6.5% or higher** — diabetes range

**Rough conversion to an average glucose (eAG)**
- A1C 5% ≈ 97 mg/dL average
- A1C 6% ≈ 126 mg/dL average
- A1C 7% ≈ 154 mg/dL average
- A1C 8% ≈ 183 mg/dL average
- A1C 9% ≈ 212 mg/dL average
- A1C 10% ≈ 240 mg/dL average

Every **1%** drop in A1C is roughly **28 mg/dL** off your average.

**Why it matters**
One finger-stick is a snapshot. A1C is the big picture — and the long-term number most linked to diabetes complications (eyes, kidneys, nerves, heart).

**A note on speed**
A1C lags real-life changes. If you start a GLP-1 today, your A1C at 4 weeks only reflects ~4 weeks of new behavior mixed with ~8 weeks of old behavior. Give it 3 months before you judge.
`,
    science: `
Hemoglobin A1C (HbA1c) reflects non-enzymatic glycation of the N-terminal valine of hemoglobin β-chains by circulating glucose — an irreversible ketoamine (Amadori) product. Because erythrocytes circulate for ~100–120 days before splenic clearance, HbA1c integrates mean glycemia over approximately 8–12 weeks, weighted more heavily toward the most recent 4 weeks (~50%).

**Reporting**
- **% (NGSP):** historical US standard, traceable to DCCT.
- **mmol/mol (IFCC):** international SI; HbA1c(mmol/mol) = (HbA1c(%) − 2.15) × 10.929.
- **eAG (estimated average glucose, mg/dL):** 28.7 × A1C − 46.7 (ADAG study regression).

**Diagnostic cutpoints (ADA)**
- Normal: <5.7%
- Prediabetes: 5.7–6.4%
- Diabetes: ≥6.5% (confirmed on repeat testing absent unequivocal hyperglycemia)

**Caveats and confounders** — any condition altering RBC lifespan or hemoglobin structure distorts A1C:
- **Falsely low:** hemolytic anemia, recent blood loss, recent transfusion, pregnancy (2nd/3rd trimester), erythropoietin therapy, hemoglobinopathies (HbS, HbC, HbE) with some assays.
- **Falsely high:** iron-deficiency anemia, B12/folate deficiency, splenectomy, chronic kidney disease (uremia-induced carbamylation interference), high-dose vitamin C/E with some assays.
- **Hemoglobinopathies** — request an assay validated for variants (HPLC with variant detection or boronate affinity).

**Clinical correlation**
- DCCT and UKPDS: each 1% HbA1c reduction yields ~35% reduction in microvascular complications.
- Targets are individualized: <7% for most adults, <6.5% for motivated individuals without hypoglycemia risk, <8% for older adults with comorbidities or limited life expectancy.
- Time in range (TIR) on CGM is an increasingly favored complement: 70–180 mg/dL >70% of readings correlates with A1C ~7%.
`,
    faq: [
      { q: 'How often should I check it?', a: 'Every 3 months if you\'re making changes (starting a GLP-1, new diet). Every 6 months if you\'re stable and in range. Your provider decides.' },
      { q: 'Can I lower A1C without medication?', a: 'Yes — diet, weight loss, and exercise can each drop A1C by 0.5–1.0%. Medication stacks on top of those, not in place of them.' },
      { q: 'Why is my A1C different from my CGM average?', a: 'They measure different things. CGM is interstitial glucose, averaged over the period you wore it. A1C reflects ~3 months, weighted toward recent weeks, and can be shifted by any condition affecting red blood cells.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'carbs-and-sugars',
    title: 'How do carbs and sugars affect glucose?',
    category: 'nutrition',
    icon: 'Cookie',
    diagram: 'GlucoseCurveDiagram',
    summary: 'Every digestible carb turns into blood glucose. The speed depends on how refined the carb is and what else you eat with it.',
    keywords: ['carbs','carbohydrate','sugar','fructose','sucrose','glycemic','fiber','starch','blood sugar spike','insulin'],
    simple: `
**The 30-second version**
Almost every carb you eat ends up as glucose in your blood. The question isn't *whether* it spikes your sugar — it's **how fast** and **how high**.

**Three kinds of carbs**
1. **Sugars (simple).** Table sugar, fruit juice, soda, candy, white bread, white rice, most cereals. Hit the blood within 15–30 minutes.
2. **Starches (complex).** Oats, beans, whole grains, sweet potatoes. Slower — 30–90 minutes — because the body has to cut longer chains.
3. **Fiber.** Technically a carb, but you can't digest most of it. Fiber slows everything down and mostly doesn't raise sugar.

**Net carbs idea** (useful on keto/low-carb labels):
> Total carbs − fiber − some sugar alcohols = the carbs that actually raise your glucose.

**What flattens the spike**
- **Fiber** in the same meal (vegetables, beans, oats)
- **Protein** (chicken, fish, eggs, tofu, Greek yogurt)
- **Fat** (olive oil, avocado, nuts)
- **Vinegar** with the meal — small but real effect
- **A walk within 30 minutes** of eating — muscles pull glucose out of blood without needing insulin

**What makes it worse**
- **Liquid sugar** (juice, soda, sweet coffee) — no fiber, no chewing, no fat, absorbs instantly.
- **Eating carbs first** — end-of-meal carbs spike less than starting with bread.
- **Low sleep, stress, illness** — all push glucose up even without eating.

**Rule of thumb for a GLP-1 user**
Aim for: **protein first, veggies next, then the carb.** Cut liquid sugar. Watch "healthy" traps (smoothies, granola, fruit yogurt, trail mix).
`,
    science: `
**Carbohydrate classes**
- **Monosaccharides:** glucose, fructose, galactose.
- **Disaccharides:** sucrose (glucose-fructose), lactose (glucose-galactose), maltose (glucose-glucose).
- **Oligosaccharides:** e.g., raffinose, fructooligosaccharides (prebiotic).
- **Polysaccharides (starch):** amylose (linear α-1,4), amylopectin (branched α-1,4 and α-1,6). Resistant starch resists small-bowel digestion and is fermented colonically.
- **Non-starch polysaccharides (fiber):** soluble (β-glucan, pectin, psyllium) and insoluble (cellulose, lignin).

**Digestion kinetics**
Salivary and pancreatic α-amylase cleave starch to maltose/maltotriose; brush-border disaccharidases (maltase-glucoamylase, sucrase-isomaltase, lactase) yield monosaccharides. SGLT1 transports glucose/galactose across the apical enterocyte (Na⁺-coupled); GLUT5 handles fructose. Basolateral GLUT2 exports to portal blood.

**Fructose** bypasses glucose's regulatory checkpoints — not insulin-dependent, not reliant on glucokinase, and hepatic metabolism (fructokinase → F1P → DHAP/glyceraldehyde) feeds directly into glycolysis and de novo lipogenesis. Large liquid fructose loads (HFCS) increase hepatic triglyceride synthesis and VLDL secretion.

**Glycemic index (GI) and glycemic load (GL)**
- GI: 2-h iAUC of a 50 g available-carb portion vs. glucose reference.
- GL: GI × grams available carb / 100. Clinically more useful than GI alone.
- High-GI foods (>70): white bread, instant rice, cornflakes, glucose.
- Low-GI foods (<55): legumes, steel-cut oats, most intact fruits, non-starchy vegetables.

**Factors modulating postprandial response**
- **Fiber:** viscous soluble fiber (β-glucan, psyllium) delays gastric emptying and carbohydrate absorption.
- **Protein:** co-ingested protein slows emptying and stimulates insulin and GLP-1/GIP incretin secretion.
- **Fat:** slows gastric emptying; chronic high-fat + high-carb combinations impair β-cell function via lipotoxicity.
- **Meal order:** protein/vegetables before carbohydrate reduces peak glucose by 20–40% (small studies, replicated).
- **Postprandial activity:** 10–15 min walking within 30 min of meal increases insulin-independent GLUT4 translocation in skeletal muscle (AMPK-mediated).
- **Circadian effects:** insulin sensitivity is higher in the AM; identical meals produce larger excursions at dinner vs. breakfast.

**On GLP-1 therapy**
Delayed gastric emptying attenuates the postprandial glucose peak by ~30–50%, shifts it later (often 90–120 min rather than 60), and reduces overall iAUC. This is why post-meal readings may look unexpectedly low while fasting values remain the primary glycemic metric.
`,
    faq: [
      { q: 'Are all carbs bad?', a: 'No. Carbs in beans, lentils, oats, and whole fruits come with fiber, vitamins, and plant compounds. The problem is concentrated, refined carbs with no fiber: sugar, juice, white flour.' },
      { q: 'Does fruit spike blood sugar?', a: 'Whole fruit usually causes only a modest rise — fiber and water dilute the sugar. Juice is effectively soda. Dried fruit is concentrated — treat like candy.' },
      { q: 'What about artificial sweeteners?', a: 'Most don\'t raise glucose directly. Evidence is mixed on whether they shift gut microbiome or appetite. They\'re generally fine in moderation; they\'re not a free pass.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'eating-on-glp1',
    title: 'How to eat when on GLP-1s',
    category: 'nutrition',
    icon: 'Salad',
    diagram: 'PlateDiagram',
    summary: 'Protein first, smaller portions, lots of water. Avoid very fatty, very sweet, and very large meals — your stomach is slower now.',
    keywords: ['eating','diet','nutrition','protein','hydration','nausea','portion','meal','plate','fiber','ozempic diet'],
    simple: `
Your stomach empties slower now. Food sits there longer, so "just one more bite" can flip into nausea fast. Eat like you've got half the room — because you do.

**The four habits that make the biggest difference**

1. **Protein first, every meal.** Aim for **25–35 g per meal**, **80–100+ g per day**. Eggs, Greek yogurt, cottage cheese, chicken, fish, tofu, edamame, protein shakes. Protein also protects muscle while you lose weight.
2. **Water. A lot of it.** 80–100 oz / 2.5–3 L per day. GLP-1s blunt thirst, constipate, and cause kidney issues if you get behind. Electrolytes help.
3. **Fiber, daily.** 25–35 g. Vegetables, berries, beans, chia, psyllium. Fights constipation and slows glucose even more.
4. **Small meals, eat slowly.** Put the fork down between bites. Stop at "satisfied," not "stuffed." Overfilling a slow stomach = nausea or reflux at 2 AM.

**The GLP-1 plate**
Half non-starchy veg, a quarter protein, a quarter slow carb. A palm of fat (avocado, olive oil, nuts).

**Foods that tend to cause trouble**
- **Greasy fast food** — fat slows emptying even more; classic trigger for "sulfur burps" and nausea.
- **Big sugary drinks** — nausea-on-demand for most people.
- **Ultra-processed, super-sized meals** — buffets, huge pasta plates, fried food combos.
- **Alcohol** — hits harder on an empty stomach; can amplify nausea and hypoglycemia (especially with insulin or sulfonylureas).
- **Carbonated drinks** — distend the already-slow stomach.

**Foods that usually sit well**
Eggs, Greek yogurt, chicken breast, fish, cottage cheese, bananas, berries, oatmeal, broth-based soups, rice, baked potato.

**When nausea hits**
- Stop eating the moment you feel full.
- Cold > hot foods (less smell).
- Ginger tea, peppermint, small sips of water.
- Walk, don't lie down.
- Ask your provider about ondansetron if it persists.

**Muscle matters**
A third of GLP-1 weight loss can come from muscle if you're sedentary and underfeeding protein. Eat the protein. Lift something heavy twice a week. Walk.
`,
    science: `
**Energy and macronutrients on GLP-1 therapy**
Caloric intake typically drops 20–40% once the therapeutic dose is reached. Without deliberate protein and resistance-training intake, observational data show ~25–40% of weight lost is lean mass — higher than the ~20% typical of non-pharmacologic diet interventions. Targets:

- **Protein:** 1.2–1.6 g/kg/day (ideal body weight) for adults without CKD; 25–40 g at each main meal to maximally stimulate muscle protein synthesis (leucine threshold ~2.5–3 g).
- **Fiber:** 25–38 g/day; emphasize soluble/viscous fiber (psyllium, oats, legumes) for gastric-emptying-compatible satiety and stool bulk.
- **Fluid:** 30–35 mL/kg/day baseline; higher with GI losses. Monitor for pre-renal AKI, especially with ACEi/ARB or SGLT2i co-therapy.
- **Fat:** 20–35% of energy; minimize high-fat meals (>40 g at once) during titration — the additional gastric-emptying delay from lipid + GLP-1 is a common nausea trigger.

**Micronutrient vigilance**
Reduced overall intake predisposes to: vitamin D, B12 (especially with metformin), iron, calcium, magnesium insufficiency. Consider a multivitamin during active weight-loss phase. Recheck 25-OH vitamin D and B12 annually.

**GI symptom management**
- Nausea: small frequent meals, cool bland foods, ginger (1–2 g/day), avoid high-fat and fried food. Ondansetron 4 mg q8h PRN is typical prescriber response for persistent cases.
- Constipation: fluid + fiber first; osmotic laxative (polyethylene glycol) preferred over stimulants for long-term use.
- Reflux/eructation: portion control, avoid lying down within 2–3 hours post-meal, smaller meals; short PPI course if persistent.
- Diarrhea: usually transient; rule out lactose or sugar alcohols; loperamide PRN.

**Alcohol**
GLP-1 therapy consistently reduces alcohol craving and intake in clinical observations and preliminary RCTs (anti-craving effects appear CNS-mediated). Concurrent use still carries: (1) additive nausea; (2) hypoglycemia risk with insulin or sulfonylureas via impaired hepatic gluconeogenesis; (3) increased aspiration risk if sedated with a delayed-emptying stomach — relevant for anesthesia (hold GLP-1 7 days pre-procedure per current ASA guidance as of 2023–2024).

**Resistance training**
Even 2×/week resistance exercise + adequate protein preserves most lean mass during GLP-1-mediated weight loss. Sarcopenia risk is real in older patients on these agents.
`,
    faq: [
      { q: 'Do I have to count calories?', a: 'Most people don\'t need to. The medication handles appetite. Count protein and fiber instead — those are the two things easy to under-eat.' },
      { q: 'Can I do keto / intermittent fasting on GLP-1?', a: 'Carefully. Combined appetite suppression can leave you under-eating protein and dehydrated. If you fast, keep it short and front-load protein in the eating window.' },
      { q: 'Why do I get sulfur burps?', a: 'Classic GLP-1 sign — fat sitting in a slow stomach fermenting. Eat less fat that meal, drink water, walk.' },
      { q: 'Should I stop my medication before surgery?', a: 'Yes — current anesthesia guidance is to hold weekly GLP-1s for ~7 days before procedures requiring anesthesia. Tell your surgeon and anesthesiologist.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'spikes-temporary-vs-lasting',
    title: 'Temporary vs. lasting glucose spikes',
    category: 'glucose',
    icon: 'TrendingUp',
    diagram: 'SpikeTypesDiagram',
    summary: 'A single high reading after pizza is different from glucose that stays high for days. One is normal, the other is a warning.',
    keywords: ['spike','spikes','high glucose','hyperglycemia','dka','stress','illness','dawn phenomenon','postprandial'],
    simple: `
Not all high readings mean the same thing. It helps to think in two buckets:

**🔵 Temporary spike (minutes to hours)**
- You ate carbs. Glucose goes up, peaks around 30–90 minutes, returns to baseline.
- Stress, a workout, poor sleep the night before, or even a strong coffee can push a reading up 20–40 points for a while.
- **What to do:** usually nothing. Drink water, maybe take a 10-minute walk, move on.

**🔴 Sustained elevation (hours to days)**
- Glucose is high *between* meals, fasting, or for multiple days in a row.
- Possible causes:
  - Illness/infection (your liver dumps sugar to fight it off)
  - Steroid medication (prednisone)
  - Missed doses of GLP-1 or insulin
  - Sleep debt or chronic stress
  - A new or worse injury to insulin sensitivity (e.g. weight gain, pregnancy)
  - Dawn phenomenon — morning rise from overnight hormones
- **What to do:** this is the pattern that matters. If fasting glucose is over 130 for 3+ days, or any reading over 250, call your provider.

**🚨 When it's an emergency**
Call your care team immediately or go to urgent care / ER if:
- Glucose over **400 mg/dL**.
- Glucose over 250 + **nausea, fruity breath, fast breathing, confusion** — possible DKA (diabetic ketoacidosis), especially Type 1 but possible in Type 2 on SGLT2 inhibitors.
- Glucose under **54 mg/dL** or you can't treat a low yourself.
- Symptoms you can't explain: sudden blurry vision, extreme thirst, vomiting you can't keep anything down, chest pain.

**The "post-meal high" that's fine**
Healthy non-diabetics can hit 140–160 after pizza. It's the *shape* (quick up, quick down) that matters. If it's up and staying up 3 hours later, that's the problem.
`,
    science: `
**Postprandial glucose excursions**
Normal 2-h postprandial glucose in non-diabetics rarely exceeds 140 mg/dL. In T2DM or prediabetes, blunted first-phase insulin secretion and peripheral insulin resistance drive higher peaks (often 180–250+ mg/dL) that persist longer before declining.

**Common drivers of transient hyperglycemia**
- High-GI meals (see carb topic).
- Sympathetic surge: acute stress, pain, exercise (short-term catecholamine-driven hepatic glucose output).
- Dawn phenomenon: cortisol and GH nocturnal surge → hepatic gluconeogenesis → fasting glucose rise 04:00–08:00.
- Somogyi effect: rebound hyperglycemia following nocturnal hypoglycemia (less common than dawn; requires overnight testing to distinguish).
- Exogenous: corticosteroids, thiazides, atypical antipsychotics, tacrolimus, β-agonists, niacin.
- Illness: counter-regulatory cytokine response; insulin resistance up-regulated.

**Persistent hyperglycemia**
Sustained glucose >200 mg/dL points to mechanisms beyond meal timing:
- Medication adherence failure or inadequate dosing.
- Infection (UTI, dental, skin — a classic trigger for HHS/DKA).
- Occult endocrine disease (Cushing's, pheochromocytoma, acromegaly).
- Pancreatic dysfunction — post-pancreatitis diabetes, pancreatic cancer.
- β-cell failure progression in long-standing T2DM.

**Emergencies**
- **DKA** (diabetic ketoacidosis): glucose typically >250, pH <7.3, HCO₃ <18, anion gap, ketonemia/uria. Classic in T1DM but possible in T2DM, especially euglycemic DKA on SGLT2 inhibitors — **glucose may be only modestly elevated or even normal**. Symptoms: Kussmaul breathing, fruity/acetone breath, abdominal pain, altered mental status.
- **HHS** (hyperosmolar hyperglycemic state): glucose >600, serum osmolality >320, minimal ketones, profound dehydration, altered mental status. T2DM, especially elderly with limited water access.
- **Severe hypoglycemia**: glucose <54 mg/dL with neuroglycopenia (confusion, seizure, coma). Requires immediate carbohydrate or glucagon.

**GLP-1–specific note**
GLP-1 agonists generally flatten postprandial excursions and rarely cause hypoglycemia as monotherapy, but they do not prevent stress/illness-driven hyperglycemia. During acute illness, continue the medication (unless GI intolerance precludes) and check more frequently. Sudden worsening glycemic control despite good adherence warrants evaluation for concurrent illness, steroid exposure, or β-cell decompensation.
`,
    faq: [
      { q: 'My glucose was 180 after dinner. Should I panic?', a: 'No — look at the shape. If it\'s back under 140 by two hours, and your fasting numbers are fine, you had a meal-sized spike. If 180 is where you\'re sitting all evening, that\'s different.' },
      { q: 'My fasting glucose crept up even though I didn\'t change anything. Why?', a: 'Sleep debt, new stress, a recent illness, a medication change (especially steroids), or early β-cell fatigue. Track it for a week — if the pattern holds, call your provider.' },
      { q: 'Can exercise make glucose temporarily higher?', a: 'Yes — intense exercise releases catecholamines and can push glucose up 20–60 points briefly, then drops it well below baseline for 12–24 hours. This is normal.' },
    ],
  },

  // ─── Added-value topics ────────────────────────────────────────────────
  {
    id: 'injection-basics',
    title: 'Injection basics and site rotation',
    category: 'basics',
    icon: 'Syringe',
    summary: 'Where, when, and how to inject a weekly GLP-1 — and the small things that make it hurt less.',
    keywords: ['injection','how to inject','rotation','site','pen','ozempic pen','needle','sub-q','subcutaneous','technique'],
    simple: `
Most GLP-1s are **subcutaneous** — in the fat just under the skin, not into muscle. Standard sites:

- **Belly** — easy, well-tolerated. Stay ~2 inches from the navel.
- **Thigh** — front or outer, the fleshy part.
- **Back of the upper arm** — usually needs someone to help you reach it.

**Pro tips**
- **Rotate** every week. Pick a new spot at least an inch from the last one. Same area is fine; same exact spot is not.
- **Room-temperature pen** hurts less than cold from the fridge. Let it sit out 15–20 minutes before use.
- **Clean skin; dry it fully.** Alcohol swab burns when wet.
- **Pinch up** a fold of fat. Go in at 90°.
- **Push steady.** Wait a few seconds after the click. Pull straight out.
- A dab of blood or a small bruise is normal. A welt the size of a quarter for a few days is also common.

**Timing**
Same day each week, ± 3 days of wiggle room. With food or without — doesn't matter for the shot.

**Storage**
- Unopened: **fridge**, 36–46 °F (2–8 °C). Don't freeze.
- In-use: most pens are fine at **room temp for up to ~56 days**. Check your specific medication's label.
- Thrown out a cold one by accident? Most pens survive a few hours out; call the pharmacy if in doubt.

**If you miss a dose**
- **<5 days late:** take it as soon as you remember.
- **>5 days late:** skip it, take the next on schedule. Don't double up.
`,
    science: `
**Injection technique (SC)**
GLP-1 receptor agonists are formulated for subcutaneous absorption via lymphatic and local capillary uptake. Depth is not critical — 4–6 mm pen needles suffice in most patients; the "pinch" prevents intramuscular delivery in lean individuals where SC tissue may be <8 mm.

**Site-specific absorption**
- **Abdomen:** fastest absorption, most consistent; preferred for reliable pharmacokinetics.
- **Thigh:** slower but clinically equivalent for weekly agents.
- **Upper arm:** intermediate; avoid near the deltoid to reduce IM risk.

**Rotation rationale**
Repeated injection at the same point causes lipohypertrophy (firm nodules from adipocyte hyperplasia), which alters and slows absorption — a well-documented cause of erratic glycemic control in insulin users, and plausible for GLP-1 users as well. Rotate within and across sites.

**Storage stability**
Cold chain maintains peptide integrity. In-use room-temperature stability varies by product (semaglutide Ozempic/Wegovy: 56 days ≤30°C; dulaglutide: 14 days ≤30°C; tirzepatide: 21 days ≤30°C). Freezing denatures the protein — discard any pen that has frozen.

**Missed dose rules** (weekly products)
- Within 5 days of scheduled dose: administer; resume regular schedule.
- >5 days: skip missed dose; administer next at regularly scheduled time.
- >2 weeks off: restart titration conservatively — GI tolerance may regress; consult prescriber.

**Perioperative**
ASA 2023 guidance: hold weekly GLP-1 for 1 week before elective procedures requiring anesthesia due to delayed gastric emptying and aspiration risk. Daily agents: hold on procedure day.
`,
    faq: [
      { q: 'Does it hurt?', a: 'Most people say barely. Pen needles are extremely thin (32G). The sting of alcohol still wet or a cold pen is usually worse than the needle itself.' },
      { q: 'Can I inject through clothing?', a: 'Not recommended. Clean skin, clean technique.' },
      { q: 'I saw blood / a bruise / a welt. Is that bad?', a: 'Usually no. Tiny capillary hits happen. Rotate away next time. Call your provider if the welt is hot, tender, expanding, or lasts past a week.' },
    ],
  },

  {
    id: 'side-effects',
    title: 'Common side effects and how to handle them',
    category: 'safety',
    icon: 'AlertTriangle',
    summary: 'Nausea, constipation, heartburn, fatigue — the usual suspects and what actually helps.',
    keywords: ['side effects','nausea','vomit','constipation','diarrhea','reflux','heartburn','fatigue','burp','sulfur','gallstones','pancreatitis'],
    simple: `
**Very common (~1 in 3 or more)**
- **Nausea** — worst in the first 4–8 weeks and after dose increases. Small, bland, cool meals. Ginger, peppermint. Don't lie down right after eating.
- **Constipation** — slow stomach means slow everything. Water + fiber + magnesium or miralax. Walk daily.
- **Diarrhea** — usually transient. Rule out lactose, sugar alcohols, and "keto" protein bars.
- **Burping** (often sulfur-smelling) — fat sitting in a slow stomach. Smaller, lower-fat meals; walk after eating.
- **Fatigue** — common the first few weeks. Usually driven by under-eating and dehydration more than the drug itself.
- **Injection-site reactions** — red, itchy spot that fades over days.

**Less common but tell your doctor**
- **Persistent vomiting** (can't keep fluids down)
- **Severe, steady abdominal pain radiating to the back** — could be pancreatitis
- **Right upper belly pain, especially after fatty meals** — could be gallstones
- **Rapid heart rate, new palpitations**
- **Vision changes** in people with diabetic retinopathy
- **Signs of low blood sugar** (shakiness, sweats, confusion) — more likely if you're also on insulin or a sulfonylurea

**Red flags — urgent**
- Severe, unrelenting abdominal pain
- Vomiting blood
- Signs of severe allergic reaction (face/tongue swelling, trouble breathing)
- Signs of DKA (see glucose topic)

**The nausea playbook**
1. Cut meal size in half.
2. Protein first; cut fat this meal.
3. Cool / bland beats hot / greasy. Smells are triggers.
4. Sip water, not gulp.
5. Walk, don't lie down.
6. Ginger (tea, candies) or peppermint.
7. Still bad by day 3? Call your provider — ondansetron often helps.
`,
    science: `
**Mechanistic basis of GI effects**
The principal driver is **delayed gastric emptying**. CNS effects at the area postrema (chemoreceptor trigger zone) contribute directly to nausea. Chronic users typically experience tachyphylaxis to gastric effects over weeks.

**Frequency (pooled trial data, titration phase)**
- Nausea: 30–45%; most resolve within 4–8 weeks.
- Diarrhea: 12–25%.
- Constipation: 10–20%.
- Vomiting: 8–15%.
- Abdominal pain: 5–15%.

**Serious adverse events (uncommon)**
- **Acute pancreatitis:** absolute risk low (~0.1–0.2%/year) but elevated vs. placebo in some meta-analyses; stop drug and evaluate for any severe, persistent abdominal pain with anorexia/vomiting.
- **Cholelithiasis / cholecystitis:** weight loss itself is a gallstone risk; GLP-1s may modestly increase incidence. Fatty-food RUQ pain → imaging.
- **Medullary thyroid carcinoma (MTC):** rodent carcinogenicity led to boxed warning. Contraindicated in MEN2 and personal/family history of MTC. Human signal unclear.
- **Diabetic retinopathy worsening:** observed with rapid A1C drops (SUSTAIN-6 with semaglutide). Baseline eye exam in patients with diabetes.
- **Euglycemic DKA:** rare; more reported with SGLT2 + GLP-1 combinations.
- **Gastroparesis:** controversial — GLP-1s cause functional delay, not structural gastroparesis. Persistent severe symptoms after 3+ months warrant gastric emptying study.

**Management principles**
- Slow titration is the single most important mitigator.
- Hold or drop back one dose if intolerable; re-escalate later.
- Discontinue for severe pancreatitis, suspected MTC, severe cholecystitis; consider permanent discontinuation.
- Symptomatic: ondansetron 4 mg q8h PRN nausea; PEG-3350 for constipation; loperamide for diarrhea.
`,
    faq: [
      { q: 'How long does the nausea last?', a: 'Most people feel best 3–4 weeks into a given dose. Each dose increase often resets the clock for ~1–2 weeks. If you\'re 2+ months into a stable dose and still nauseated daily, that\'s worth a conversation with your provider.' },
      { q: 'Can I drink alcohol on it?', a: 'You can. Most people want to less. It amplifies nausea, and on an empty (slow-emptying) stomach it absorbs unpredictably. Keep it modest and with food.' },
      { q: 'Is fatigue from the drug or the diet?', a: 'Usually the diet. Under-eating protein and not drinking enough water both produce the same fatigue. Fix those first before blaming the medication.' },
    ],
  },

  {
    id: 'hypoglycemia',
    title: 'Low blood sugar (hypoglycemia)',
    category: 'safety',
    icon: 'AlertCircle',
    summary: 'What it is, what it feels like, and the 15-15 rule that handles most of it.',
    keywords: ['low','hypo','hypoglycemia','shaky','dizzy','sweaty','15-15','glucagon','juice'],
    simple: `
Low blood sugar = glucose below **70 mg/dL**. Below **54** it's clinically dangerous.

**What it feels like** (in order of severity)
- Shaky hands
- Cold sweat
- Dizzy / lightheaded
- Fast heartbeat
- Irritable or confused
- Blurry vision
- Slurred speech
- Hard to wake up (emergency)

**The 15-15 rule**
If you can eat:
1. Take **15 g of fast sugar** — 4 oz juice, 4 glucose tabs, a tablespoon of honey, regular soda (not diet), 3 hard candies.
2. **Wait 15 minutes.**
3. Re-check. If still <70, repeat.
4. Once back above 70, eat a small **protein+carb snack** (cheese and crackers, peanut butter toast) to stabilize.

**When to call 911 / use glucagon**
- Can't swallow safely (confused, passing out)
- Seizure
- Won't wake up

Don't pour sugar down someone who's unconscious — aspiration risk. Use a glucagon kit if prescribed (nasal Baqsimi, Gvoke pen, or traditional syringe).

**Do GLP-1s cause lows?**
**Rarely on their own.** They only release insulin when glucose is elevated. But they *do* increase low risk when combined with:
- **Insulin** — you usually need less. Talk to your provider.
- **Sulfonylureas** (glipizide, glimepiride, glyburide) — same story.
- **Alcohol, especially on an empty stomach** — shuts down the liver's emergency glucose production.

**Preventing lows**
- Don't skip meals if you're on insulin/sulfonylurea.
- Always carry fast sugar (tabs, gel, hard candy).
- Extra-careful around exercise, alcohol, and illness.
- Check before driving if you're prone.
`,
    science: `
**Definition (ADA/Endocrine Society)**
- **Level 1:** <70 mg/dL (3.9 mmol/L) — glucose alert value.
- **Level 2:** <54 mg/dL (3.0 mmol/L) — clinically significant hypoglycemia.
- **Level 3:** severe — requires external assistance, regardless of value.

**Physiology**
Counter-regulatory hormone cascade activates at ~70 mg/dL: glucagon, then epinephrine (autonomic symptoms), cortisol, growth hormone. Neuroglycopenic symptoms (confusion, coma) typically <50 mg/dL. **Hypoglycemia unawareness** develops in patients with recurrent lows — autonomic warnings blunted; ADA recommends avoiding lows for 2+ weeks to restore awareness.

**GLP-1 and hypoglycemia**
As monotherapy, GLP-1 RAs carry minimal hypoglycemia risk due to glucose-dependent insulin secretion. Risk rises substantially when combined with:
- **Insulin:** consider prophylactic basal insulin reduction 20% when starting GLP-1; titrate to glycemic targets.
- **Insulin secretagogues (sulfonylureas, glinides):** reduce dose 50% or discontinue when starting, per ADA Standards of Care.

**Treatment**
- Conscious, able to swallow: 15–20 g fast-acting carb, re-check in 15 min. Follow with mixed snack.
- Unconscious or seizing: glucagon (nasal 3 mg Baqsimi, SC/IM 1 mg traditional, Gvoke HypoPen/prefilled). IV D50 in-hospital.
- Never oral administration to unresponsive patient (aspiration).

**Driving / occupational considerations**
Document lows. Many jurisdictions require glucose >90 mg/dL before commercial driving; personal driving guidance generally >70 with a snack.

**Post-event review**
- Missed meal? Unplanned activity? Alcohol? Medication error?
- Recurrent unexplained lows warrant medication review and 24/7 CGM if not already in place.
`,
    faq: [
      { q: 'Is a reading of 65 an emergency?', a: 'Not an emergency — but treat it now. Fast sugar, 15-minute rewait. It\'s the difference between "fix in 10 minutes" and "go to the ER in 30".' },
      { q: 'Why do I feel low at 90 mg/dL?', a: 'If you\'re used to running 150+, dropping into the 80s-90s can feel like a low even though it\'s technically normal. Usually resolves as your body acclimates over a few weeks.' },
      { q: 'Can I drive with a slightly low reading?', a: 'No. Treat first, wait 15-20 minutes for it to rise, eat a snack, then drive. Low-glucose cognition is closer to drunk driving than most people realize.' },
    ],
  },

  {
    id: 'movement-matters',
    title: 'Why movement matters (and what counts)',
    category: 'lifestyle',
    icon: 'Zap',
    summary: 'A 10-minute walk after dinner does more for your glucose than almost any food trick.',
    keywords: ['exercise','walk','movement','resistance','muscle','strength','insulin sensitivity','nmao'],
    simple: `
Muscle is your biggest glucose sink. The moment you use it, it pulls sugar out of your blood — without needing insulin. That's the entire superpower.

**The smallest useful dose**
- **10-minute walk after any meal.** Drops post-meal glucose by 12–20% typical, sometimes more. Single best habit on this list.
- **Two 20-minute strength sessions/week.** Bodyweight, bands, or weights. Keeps muscle while you lose weight — crucial on GLP-1s.
- **Daily step floor, e.g. 6,000–8,000.** Doesn't matter when or how. Count dog walking and grocery runs.

**What counts**
- Walking briskly enough to talk but not sing.
- Carrying groceries up stairs.
- Yardwork, vacuuming, mopping.
- Chasing kids.
- Any "strength" activity — squat to stand, push against a wall, carry heavy things.

**What works less well**
- "Fasted cardio" alone on GLP-1 — you may be under-fueled already. Eat some protein first.
- Marathon training while in a deep calorie deficit — common cause of fatigue and muscle loss.

**Stacking with GLP-1**
- GLP-1 shrinks appetite; exercise protects muscle. **Both, not either.**
- Expect less endurance at first. You're eating less. Scale back intensity, keep frequency.
- Hydrate *before*, not just during. Thirst is blunted.

**Glucose and exercise**
- Aerobic (walking, cycling, swimming) → gradually lowers glucose.
- High-intensity (sprints, heavy lifting) → can briefly *raise* glucose, then drops it for 12–24 hours.
- Long workouts on insulin — check before, during, after. Carry fast carb.
`,
    science: `
**Glucose uptake mechanisms**
Skeletal muscle contraction triggers AMPK-mediated GLUT4 translocation independently of insulin. A single bout of moderate-intensity exercise increases muscle insulin sensitivity for up to 24–48 hours (acute post-exercise effect). Chronic training up-regulates mitochondrial density and insulin-signaling proteins.

**Dose-response**
- **Aerobic:** 150 min/week moderate or 75 min vigorous — ADA and WHO targets. Each additional 30 min/week yields measurable A1C improvement.
- **Resistance:** 2–3 sessions/week, 8–10 compound movements, 8–12 reps. Improves insulin sensitivity and lean mass retention — particularly relevant during GLP-1-mediated weight loss (25–40% of weight lost otherwise comes from lean mass).
- **Post-meal walking (10–15 min):** reduces postprandial iAUC 12–22% in crossover trials.

**High-intensity exercise and transient hyperglycemia**
Sympathetic catecholamine surge → hepatic glycogenolysis and gluconeogenesis transiently exceeds peripheral uptake. Glucose may rise 20–80 mg/dL during/immediately post-exercise, then fall sharply. Not pathological; not a reason to avoid intensity.

**GLP-1 interactions**
- Exercise does not alter GLP-1 agonist PK meaningfully.
- Combined intervention (GLP-1 + structured exercise) preserves lean mass better than GLP-1 alone (STEP-5 and other trials).
- Caution: increased fall risk with early dose escalations if orthostatic symptoms present — especially elderly.

**Insulin/sulfonylurea users**
Long-duration or unusually intense exercise may require carbohydrate pre-load (15–30 g/hour) or insulin dose reduction (e.g., 20–50% basal reduction on heavy-activity days). Individualize with care team.
`,
    faq: [
      { q: 'Will exercise cause muscle loss on a GLP-1?', a: 'The opposite — resistance exercise prevents the muscle loss that happens from eating less. The combination of protein + lifting is the recipe for "good" weight loss on these drugs.' },
      { q: 'Is cardio or weights better?', a: 'Both. Cardio is better for insulin sensitivity and heart. Weights are better for muscle retention and resting metabolism. Most people need more weights than they do.' },
      { q: 'I hate exercise. What\'s the floor?', a: 'One 10-minute walk after dinner, 5 days a week. That\'s it. Anything beyond is a bonus.' },
    ],
  },

  {
    id: 'sleep-stress-glucose',
    title: 'Sleep, stress, and blood sugar',
    category: 'lifestyle',
    icon: 'Moon',
    summary: 'A single bad night of sleep can raise your glucose like a piece of cake. Stress and cortisol do the same.',
    keywords: ['sleep','stress','cortisol','apnea','insomnia','anxiety','dawn phenomenon'],
    simple: `
Two hidden forces drive blood sugar up without you eating anything: **bad sleep** and **stress**.

**Sleep**
One night of <5 hours can cut insulin sensitivity by ~30%. That means the same breakfast spikes higher. Chronic short sleep (less than 6 hours/night) is tied to prediabetes and weight gain independent of diet.

**What helps**
- Same sleep and wake time every day — even weekends.
- No screens in bed; dim lights 1 hour before sleep.
- Cold, dark, quiet bedroom.
- Cut caffeine after ~noon.
- If you snore and feel wrecked — **get screened for sleep apnea.** It's under-diagnosed and it crushes glucose control.

**Stress**
Acute stress releases cortisol and epinephrine → liver dumps glucose → fasting numbers rise. Chronic stress keeps you in that elevated baseline.

**What helps**
- Walks outside in daylight. Not an accident this keeps coming up.
- Breathing work — 5 minutes of slow breathing (4-count in, 6-count out) measurably lowers cortisol.
- Social time. Isolation behaves like chronic stress metabolically.
- Therapy if anxiety is running the show.

**The dawn phenomenon**
Between ~4 and 8 AM, cortisol and growth hormone rise. Your liver makes glucose for the "wake up" surge. Fasting glucose can be 20–40 mg/dL higher than at 2 AM even if you didn't eat. This is normal physiology. If your fasting is chronically too high, talk to your provider about timing or dose.
`,
    science: `
**Sleep and glucose**
- Short sleep (<6 h) reduces whole-body insulin sensitivity ~25–30% in healthy volunteers (Van Cauter laboratory).
- Fragmented sleep elevates evening cortisol, blunts morning insulin response.
- Obstructive sleep apnea: independent risk factor for T2DM; intermittent hypoxia → sympathetic activation, insulin resistance. CPAP treatment improves HOMA-IR and HbA1c modestly.
- Shift work: disrupted circadian insulin sensitivity; ~40% higher T2DM incidence in long-term rotating shift workers.

**Stress and glucose**
- Cortisol promotes gluconeogenesis and antagonizes insulin at target tissues.
- Chronic stress → sustained HPA activation → visceral adiposity, insulin resistance, dysglycemia.
- Acute psychological stress: catecholamine-mediated glucose rise up to 30–50 mg/dL in diabetic patients.
- Meditation/mindfulness-based interventions: modest A1C improvements (0.3–0.5%) in meta-analysis.

**Dawn phenomenon**
Nocturnal GH and cortisol surge 04:00–08:00 drives hepatic glucose output. Pronounced in T2DM due to failed insulin counter-regulation. Distinguish from Somogyi effect (nocturnal hypoglycemia → rebound) with 3 AM CGM or fingerstick.

**Clinical recommendation**
Sleep and stress assessment are underused diabetes interventions. Screen routinely:
- STOP-BANG for apnea risk.
- PHQ-9/GAD-7 for depression/anxiety.
- Sleep duration and quality (Pittsburgh Sleep Quality Index if concerned).

Targeted intervention — CPAP, CBT-I, stress reduction — frequently improves glycemic metrics as much as a medication titration.
`,
    faq: [
      { q: 'My fasting is always worst after a bad night\'s sleep. Is that real?', a: 'Very real. Expect 10–25 mg/dL higher after a short night. One bad night isn\'t a pattern; four in a row is.' },
      { q: 'Should I get checked for sleep apnea?', a: 'If you snore loudly, wake up tired despite "enough" hours, or have neck circumference >17" (men) / >16" (women) — yes. Apnea is the single most treatable hidden cause of poor glucose control.' },
    ],
  },

  {
    id: 'reading-your-data',
    title: 'Reading your own glucose and weight data',
    category: 'lifestyle',
    icon: 'LineChart',
    summary: 'What to look at in your tracker, what to ignore, and which questions to bring to your provider.',
    keywords: ['data','trends','pattern','cgm','tir','time in range','average','graph','log'],
    simple: `
A single reading is noise. **Patterns** are signal.

**The four numbers worth watching**
1. **Fasting glucose trend** — over weeks, is it going down, up, or flat?
2. **Post-meal peaks** — how high, how long?
3. **Time in range (70–180)** — % of readings (or CGM time) in target. 70%+ is good.
4. **Weight trajectory** — weekly average, not daily. Daily weight is 70% water and bathroom timing.

**Don't chase noise**
- One low reading doesn't mean you're on the edge of hypoglycemia.
- One high reading doesn't mean the diet is failing.
- Weight +2 lb overnight is water. Look at the 7-day average.

**Questions to bring to your provider**
- "Here's my fasting for the last 30 days — it's trending up. Is something changing?"
- "My A1C dropped from 7.8 to 7.1 on X mg. Are we continuing to escalate?"
- "I have 3 lows a week in the afternoon. Can we adjust my other meds?"
- "I've plateaued for 8 weeks despite doing the same things. Next step?"

**Two data pitfalls**
- **Sampling bias** — if you only check when you feel bad, your average looks bad. Check at consistent times.
- **Comparison trap** — someone else's numbers aren't yours. Genetics, age, baseline insulin resistance all differ.

**The tracker as honesty broker**
The point isn't to guilt yourself into the "right" numbers. It's to see what's actually happening so you can ask the right questions and make informed changes.
`,
    science: `
**Glycemic metrics beyond A1C**
- **Time in Range (TIR, 70–180 mg/dL):** primary continuous metric. Target >70% in most adults, >50% in high-risk (elderly, limited life expectancy). 10% TIR improvement ~= 0.5% A1C improvement.
- **Time Below Range (TBR, <70):** target <4%. <54: target <1%.
- **Time Above Range (TAR, >180):** complement of TIR + TBR.
- **Glucose Management Indicator (GMI):** estimated A1C from CGM mean glucose; (3.31 + 0.02392 × mean glucose mg/dL). Diverges from lab A1C by >0.5% in ~30% of patients due to RBC factors.
- **Coefficient of Variation (CV):** SD / mean × 100. Target <36%. Higher CV → more hypoglycemia risk at any given A1C.

**Weight trajectory**
- Expect non-linear loss: rapid in first 8–12 weeks, plateau cycles, resumed loss with dose escalation.
- **7-day rolling average** filters out water/GI weight.
- Body composition (DEXA, BIA) more informative than scale weight during active loss — confirms lean mass preservation.

**When to escalate therapy**
- A1C above individualized target at 3 months on stable dose.
- TIR <70% with adherence verified and no reversible factors.
- Weight loss plateau >3 months on maximum tolerated dose with reinforced behavioral interventions.

**When to *not* change**
- Single bad week.
- Menstrual cycle-related fluctuations (insulin resistance rises luteal phase).
- Recent illness, steroid course, or acute stressor resolving.
`,
    faq: [
      { q: 'How many readings do I need?', a: 'If not on a CGM: 2–4 fingersticks a day covers fasting, pre-meal, post-meal. Enough to spot a pattern within 2 weeks. CGM users get >288/day and should focus on TIR, not individual values.' },
      { q: 'What\'s a good trend look like?', a: 'Fasting numbers slowly descending, post-meal peaks getting lower and shorter, weight on a gentle downward slope with week-to-week wiggle. Boring is good.' },
      { q: 'When should I call my provider between appointments?', a: 'Any reading >400, two or more readings <54, three days of fasting >180, symptoms you can\'t explain, a new medication side effect. Don\'t wait for your next visit.' },
    ],
  },
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'dawn-phenomenon',
    title: 'Dawn phenomenon — why is my morning glucose high?',
    category: 'glucose',
    icon: 'Sunrise',
    summary: 'Between 4 and 8 AM, hormones tell your liver to release glucose for the day. In T2DM this often overshoots, raising fasting numbers.',
    keywords: ['dawn phenomenon','dawn','morning glucose','fasting high','cortisol','growth hormone','liver','gluconeogenesis','somogyi','keto','fasting glucose'],
    simple: `
Every morning, before you wake up, your body starts preparing for the day. Around **4–8 AM** it releases a surge of hormones — mainly **cortisol** and **growth hormone** — that tell your liver to pump glucose into your bloodstream. This is your body's built-in alarm clock: a glucose boost to fuel your morning.

In people without diabetes, insulin rises to match this. Blood sugar barely moves.

In **Type 2 diabetes**, that insulin response is sluggish or insufficient — so the liver's glucose dump causes fasting glucose to be 20–50 mg/dL higher than it was at 2 AM, even though you haven't eaten a thing.

**This is completely normal physiology.** It is NOT your breakfast, it is NOT an emergency. It's just the dawn phenomenon.

**How to tell if this is what you're seeing**
- Fasting glucose is consistently higher than bedtime glucose.
- A reading at 2–3 AM is lower than your morning reading.
- You feel fine; no shakiness or sweating.

**What helps**
- **GLP-1 medications** blunt the liver's output — this is one reason they lower fasting glucose.
- **Exercise the evening before** improves overnight insulin sensitivity.
- **A small, low-carb snack before bed** (protein/fat, e.g., hard-boiled egg, handful of nuts) — sometimes lowers morning glucose by reducing the counter-regulatory surge. Counter-intuitive but real.
- **Keto/low-carb diet** reduces the amount of glucose the liver can release. Many keto + T2DM folks see the most dramatic improvement in fasting glucose.
- If it's consistently over 130, talk to your provider — timing of medications can be adjusted.

**Somogyi effect vs. dawn phenomenon**
They look the same (high morning glucose) but have opposite causes:
- **Dawn phenomenon:** hormones push glucose up from a normal baseline.
- **Somogyi effect:** a nocturnal low triggers a rebound. Requires 2–3 AM glucose check to confirm. Much less common.
`,
    science: `
**Physiology**
The dawn phenomenon is driven by the nocturnal/early-morning surge of:
- **Growth hormone (GH):** peaks ~midnight–2 AM; antagonizes insulin at skeletal muscle, increases lipolysis and free fatty acids, which further impair hepatic insulin action.
- **Cortisol:** rises sharply from ~4 AM; promotes hepatic gluconeogenesis via glucocorticoid receptor-mediated transcription of PEPCK and G6Pase.
- **Glucagon:** late-night rise contributes to hepatic glucose output.
- **Epinephrine:** minor contribution.

In healthy individuals, pulsatile insulin secretion matches hepatic glucose production. In T2DM, first-phase insulin is blunted and hepatic insulin resistance is elevated — the liver's glucose output is neither suppressed nor adequately compensated. Net effect: fasting plasma glucose 15–50+ mg/dL above the 2–3 AM nadir.

**GLP-1 mechanism**
GLP-1 receptor agonists suppress glucagon secretion and improve hepatic insulin sensitivity, directly attenuating the dawn-phase glucose surge. This is a primary mechanism by which tirzepatide/semaglutide improve fasting glucose before meaningful weight loss occurs.

**Keto / very low carb diet**
VLCD markedly reduces hepatic glycogen stores (typically depleted in 12–24 h of carb restriction) and lowers gluconeogenic substrate availability. Fasting insulin falls, which reduces mTORC1 activity and paradoxically improves hepatic insulin sensitivity. Most patients on keto + GLP-1 see fasting readings improve within 2–4 weeks — often the most dramatic early win.

**Distinguishing from Somogyi**
| Feature | Dawn Phenomenon | Somogyi |
|---|---|---|
| 3 AM glucose | Normal or low-normal | Low (<70) |
| Morning glucose | Elevated | Elevated (rebound) |
| Cause | Hormone surge | Insulin overcorrection → rebound |
| Common? | Very common in T2DM | Rare; mainly insulin-dependent patients |

CGM data or a 3 AM fingerstick resolves the question in minutes.

**Clinical interventions**
- Medication timing: some providers move evening metformin or basal insulin dose to pre-bedtime to align coverage with dawn surge.
- GLP-1 dose escalation specifically addresses fasting hyperglycemia.
- Protein/fat bedtime snack: reduces GH pulse amplitude in some studies.
`,
    faq: [
      { q: 'My fasting glucose is 120 but I eat perfectly keto. Is that normal?', a: 'On keto, many people experience "physiological insulin resistance" — cells preferentially burn fat, leaving glucose available for the brain. Combined with the dawn hormone surge, fasting readings of 100–130 are common on keto even with perfect diet. It\'s not the same as the insulin resistance of T2DM.' },
      { q: 'Should I eat breakfast to lower my morning glucose?', a: 'A low-carb breakfast can actually help by stimulating insulin release that clears the liver\'s morning glucose dump. Skipping breakfast entirely can leave elevated dawn glucose lingering into mid-morning.' },
      { q: 'My fasting number is fine some days and high others. Why so variable?', a: 'Sleep quality, stress the day before, whether you exercised, and cortisol variation all affect the hormone surge. Poor sleep is the single biggest amplifier.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'keto-and-t2d',
    title: 'Keto diet and Type 2 Diabetes — how they work together',
    category: 'nutrition',
    icon: 'Flame',
    summary: 'A very low carb diet removes the primary driver of high blood sugar and can dramatically reduce medication needs — but requires monitoring.',
    keywords: ['keto','ketogenic','low carb','type 2','t2d','t2dm','diabetes','insulin resistance','net carbs','ketosis','hba1c','remission','medication reduction'],
    simple: `
**The simple logic**
Blood sugar rises when you eat carbs. Keto almost eliminates carbs. So blood sugar stays much flatter.

This isn't a miracle or a hack — it's cause and effect. Remove the primary input, reduce the output.

**What "keto" means for blood sugar**
- Carbs are restricted to roughly **20–50 g/day** (strict keto is ~20 g net carbs).
- Without carbs, your body shifts from burning glucose to burning **fat and ketones** for fuel.
- Insulin levels fall dramatically — which is exactly what an insulin-resistant body needs.
- Liver stops storing glycogen → blood sugar has nowhere to spike from food.

**Real results in T2DM**
Studies consistently show:
- A1C drops of **1.0–2.0%** in the first 3–6 months.
- Fasting glucose drops 20–60 mg/dL.
- Many people reduce or eliminate oral medications.
- Some achieve **T2DM remission** (A1C <6.5% without medication).

**Keto + GLP-1 together**
These two work in the same direction. Both lower fasting glucose. Both reduce appetite. Together, the effects compound. Your dose requirements may be lower; your side effects may be milder (less nausea when you're eating less carb-heavy food).

**What to watch for**
- **Medication adjustment is required.** If you're on sulfonylureas or insulin AND going keto, your doctor needs to reduce your doses *before* you get dangerously low readings. Never start keto with insulin/sulfonylureas without medical guidance.
- **Electrolytes matter a lot.** Keto causes your kidneys to excrete sodium, which takes potassium and magnesium with it. See the electrolytes topic.
- **The first week is rough.** "Keto flu" — headache, fatigue, brain fog, muscle cramps — is real and temporary (3–7 days). It's mostly electrolyte loss, not carb withdrawal.
- **Protein is your friend.** Aim for 100–130 g/day. Your body can convert excess protein to glucose (gluconeogenesis), but at modest protein intakes this barely affects ketosis.

**Is keto safe for T2DM?**
Yes, with monitoring. The ADA now formally recognizes low-carb diets as a valid evidence-based approach for T2DM management. The concern historically was DKA — but that's primarily a risk in Type 1, and even then only with insulin insufficiency. T2DM with normal insulin production does not develop DKA from dietary ketosis.
`,
    science: `
**Mechanism: how VLCD improves insulin sensitivity**
- **Reduced postprandial glucose flux:** elimination of dietary carbohydrate removes the primary substrate for postprandial hyperglycemia. β-cell demand falls.
- **Reduced fasting insulin:** carbohydrate restriction lowers basal insulin secretion, reversing the receptor downregulation that underpins peripheral insulin resistance.
- **Hepatic fat reduction:** VLCD specifically targets hepatic and visceral adiposity within 2–4 weeks — well before total body weight significantly changes. Intrahepatic fat is strongly mechanistically linked to hepatic insulin resistance. A 30% reduction in liver fat can normalize hepatic glucose output.
- **AMPK activation:** fasting/caloric restriction and ketone bodies (β-hydroxybutyrate) activate AMPK, improving mitochondrial biogenesis, glucose uptake, and fatty acid oxidation.
- **GLP-1 potentiation:** keto increases endogenous GLP-1 secretion at some doses. Combined with exogenous GLP-1 therapy, this may compound glycemic benefit.

**Clinical evidence**
- Virta Health (Hallberg et al. 2018): 262 T2DM patients on supervised ketogenic diet: at 1 year, 60% reduced or eliminated diabetes medications; 94% eliminated insulin. HbA1c reduced from 7.6% to 6.3%. 12% achieved clinical remission.
- DIRECT trial (Taylor et al.): low-calorie (800 kcal) led to 24-month T2DM remission in 36% of patients — mechanism was largely hepatic fat loss, consistent with the VLCD mechanism above.
- Meta-analysis (Goldenberg et al. 2021, BMJ): at 6 months, low-carb diets outperformed low-fat diets on HbA1c reduction, fasting glucose, and triglycerides.

**Safety: DKA risk in T2DM on keto**
Nutritional ketosis (β-HB 0.5–3.0 mmol/L) is physiologically distinct from diabetic ketoacidosis (β-HB >10 mmol/L, pH <7.3). DKA requires both elevated ketones AND insulin deficiency. T2DM is characterized by insulin excess (resistance), not deficiency — DKA from dietary keto alone is not possible when endogenous insulin is present. **Exception:** patients on SGLT2 inhibitors can develop euglycemic DKA — avoid pairing SGLT2i with keto without careful provider supervision.

**Medication interaction table**
| Drug class | Risk on keto | Action |
|---|---|---|
| Metformin | Minimal | Continue; may lower dose as glucose improves |
| SGLT2 inhibitors | Euglycemic DKA | Use with caution; monitor ketones |
| Sulfonylureas | Hypoglycemia | Reduce/eliminate at keto start |
| Insulin (basal) | Hypoglycemia | Reduce 20–50% at keto start; titrate |
| GLP-1 agonist | Compounding appetite suppression | Continue; monitor for under-eating |

**T2DM remission criteria (ADA 2021)**
HbA1c <6.5% for at least 3 months in the absence of active pharmacological glucose-lowering therapy. Requires sustained dietary/lifestyle intervention to maintain.
`,
    faq: [
      { q: 'Can keto cure my diabetes?', a: '"Cure" isn\'t the right word — remission is. Diabetes returns if the diet is abandoned and weight regains. But sustained keto or low-carb with weight maintenance can produce years-long remission. Think of it as a continuous treatment, not a one-time fix.' },
      { q: 'Is 20 g of carbs per day realistic?', a: 'For strict keto, yes — it sounds extreme but gets easier within 2–3 weeks as cravings quiet. GLP-1 medications significantly help by suppressing appetite. Many people find strict keto easier on Mounjaro or Ozempic than they ever could without it.' },
      { q: 'Will my cholesterol get worse on keto?', a: 'Usually: triglycerides drop significantly, HDL rises, LDL may rise modestly (particle size typically shifts toward larger, less atherogenic). Total LDL elevation alone is not a reliable risk marker in the context of low triglycerides and high HDL. Your provider should check a full lipid panel at 3 months.' },
      { q: 'I started keto and my morning glucose is still high. Why?', a: 'Likely the dawn phenomenon — overnight cortisol still triggers a glucose release from the liver even with no dietary carbs. It usually improves over 4–8 weeks on keto as liver glycogen depletes and GLP-1 accumulates. See the dawn phenomenon topic.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'electrolytes-on-keto',
    title: 'Electrolytes on keto — why you need them and how to get them',
    category: 'nutrition',
    icon: 'Zap',
    summary: 'Keto flushes sodium, which drags potassium and magnesium with it. Keto flu, cramps, fatigue, and headaches are almost always electrolyte loss.',
    keywords: ['electrolytes','sodium','potassium','magnesium','keto flu','cramps','headache','fatigue','salt','pickle juice','broth','lyte','hydration','keto'],
    simple: `
**Why keto depletes electrolytes**
When you cut carbs, your insulin levels drop. Low insulin tells your kidneys to excrete sodium. Sodium drags water — and **potassium** and **magnesium** — out with it.

In the first 3–7 days of keto, you can lose 2–5 lbs of water weight (real, not fat). Most of the "keto flu" symptoms people experience are directly caused by this electrolyte loss — not carb withdrawal.

**The symptoms of electrolyte depletion**
- **Headache** (sodium and overall fluid loss)
- **Fatigue and brain fog** (sodium, magnesium)
- **Muscle cramps** — especially leg cramps at night (magnesium, potassium)
- **Heart palpitations** (magnesium, potassium)
- **Constipation** (magnesium)
- **Dizziness on standing** (sodium — orthostatic hypotension)
- **Irritability, poor sleep** (magnesium)

These are not reasons to stop keto — they're reasons to add electrolytes.

**The three electrolytes you need**

**1. Sodium — the most important**
- Goal: **3,000–5,000 mg/day** (more than most nutrition advice suggests; keto is an exception)
- Sources: salt your food liberally, **broth or bouillon** (1–2 cups/day), pickles or pickle juice, olives
- Most "keto flu" improves within hours of drinking salted broth

**2. Potassium**
- Goal: **3,000–4,700 mg/day**
- Sources: avocado (975 mg each!), spinach, salmon, meat, mushrooms, almonds
- Don't supplement high-dose potassium pills without medical guidance — too much too fast is dangerous

**3. Magnesium**
- Goal: **300–400 mg/day** (most people are already low even off keto)
- Sources: nuts, seeds, dark chocolate, leafy greens
- Supplement: **magnesium glycinate or malate** — 200–400 mg at bedtime, minimal GI side effects
- Avoid magnesium oxide (poor absorption, causes diarrhea)

**Simple daily protocol**
- **Morning:** 1/4 tsp salt in water or in your first meal
- **Afternoon:** cup of bone broth or bouillon
- **Evening:** 200–400 mg magnesium glycinate
- **Eat:** avocado, salmon, spinach, nuts — naturally high in potassium/magnesium
- **Drink:** 80–100 oz water daily

**Electrolyte supplements**
LMNT, Nuun, Ultima, Liquid IV (look for ones without sugar). They work well. Not required if you eat whole foods and salt, but convenient.

**Ongoing need**
The depletion is most severe in the first 2–4 weeks. After adaptation, your kidneys become more efficient and you don't need to supplement quite as aggressively — but you'll still need more sodium than a standard Western diet recommends.
`,
    science: `
**Renal electrolyte handling on a ketogenic diet**
Insulin normally acts on the renal proximal tubule to stimulate sodium reabsorption (Na⁺/H⁺ exchanger NHE3 and Na⁺-K⁺-ATPase activity). When insulin falls on VLCD, renal sodium excretion increases substantially. This is the primary mechanism of:
- **Natriuresis:** 100–300 mEq/day extra sodium excreted in the first week.
- **Osmotic diuresis:** sodium loss pulls water (2–5 kg in 7–10 days).
- **Secondary potassium loss:** volume contraction activates the RAAS → aldosterone → K⁺ excretion via cortical collecting duct principal cells.
- **Magnesium wasting:** reduced reabsorption in the thick ascending limb without adequate substrate.

**Hyponatremia risk**
Drinking large volumes of plain water on keto without replacing sodium actively dilutes plasma Na⁺. A small proportion of keto dieters develop **exercise-associated hyponatremia** (Na⁺ <135 mEq/L) — especially endurance athletes. Symptoms: headache, confusion, nausea. Treatment: sodium replacement, not fluid restriction alone.

**Potassium: food vs. supplementation**
High-dose oral potassium supplements (>100 mEq at once) risk cardiac arrhythmia. Food-based potassium is absorbed more slowly and is physiologically safer. KCl salt substitutes (NoSalt, Nu-Salt) can provide 500–800 mg K⁺/¼ tsp and are a practical supplement for keto users who want to titrate carefully.

**Magnesium: forms matter**
- **Magnesium glycinate:** high bioavailability, minimal GI effects, best for sleep/cramp use.
- **Magnesium malate:** good bioavailability, may help fatigue and muscle pain.
- **Magnesium citrate:** good absorption but osmotic laxative effect — useful for keto constipation, not for anti-cramp use.
- **Magnesium oxide:** ~4% absorption; essentially a laxative. Not useful for systemic repletion.

**Drug interactions relevant to this population**
| Drug | Interaction |
|---|---|
| ACE inhibitors / ARBs | Reduce potassium excretion — hyperkalemia risk if potassium supplementing |
| Diuretics (especially furosemide) | Compound electrolyte loss; may need dose reduction on keto |
| Metformin | Associated with B12 depletion (not electrolyte) but worth knowing |
| SGLT2 inhibitors | Compound natriuresis on keto; additional electrolyte monitoring needed |

**T2DM + keto + GLP-1 electrolyte profile**
This combination compounds sodium wasting:
1. Keto → low insulin → renal natriuresis
2. GLP-1 side effect nausea/vomiting → additional losses
3. Reduced oral intake → less dietary electrolyte
Monitor for dehydration, dizziness, cramps. Most patients need explicit electrolyte protocols, especially in the first 4–8 weeks.

**Assessment**
Basic metabolic panel (BMP) at 4–8 weeks of keto captures Na⁺, K⁺, and gives eGFR for kidney monitoring. A1C, lipid panel, and uric acid are reasonable at 3 months.
`,
    faq: [
      { q: 'I have cramps every night. What do I do?', a: 'First, add magnesium glycinate 200–400 mg at bedtime tonight — cramps are the most classic magnesium-deficiency symptom. Add a cup of broth daily for sodium. Most people see improvement within 48 hours.' },
      { q: 'Is it safe to eat a lot of salt if I have blood pressure issues?', a: 'On keto, salt sensitivity is much lower because insulin levels are low. Many people with hypertension see blood pressure improve on keto, even with higher sodium intake, due to the diuretic and weight-loss effects. Still: monitor your pressure and discuss with your provider if you\'re on antihypertensives.' },
      { q: 'Can I take an electrolyte supplement with my Mounjaro?', a: 'Yes — electrolyte powder like LMNT or Nuun is fine with GLP-1s. Avoid ones with large amounts of sugar. Magnesium glycinate at night is compatible with all GLP-1 medications.' },
      { q: 'How long do I need to actively replace electrolytes?', a: 'Most aggressively for the first 4 weeks. After keto adaptation, kidney handling improves. Many long-term keto dieters still add salt to taste and take magnesium at night indefinitely — it\'s cheap and low-risk.' },
    ],
  },
]

// ── Search ────────────────────────────────────────────────────────────────
// Lightweight, client-side, tokenized scoring. No external deps.
// Matches title strongly, keywords moderately, body lightly.

function tokenize(s) {
  return String(s ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? []
}

function tokensFromTopic(t) {
  // Pre-computed per-topic, cached on the object.
  if (t._tokens) return t._tokens
  const body = `${t.simple ?? ''} ${t.science ?? ''} ${(t.faq ?? []).map(f => `${f.q} ${f.a}`).join(' ')}`
  t._tokens = {
    title:    new Set(tokenize(t.title)),
    keywords: new Set((t.keywords ?? []).flatMap(tokenize)),
    summary:  new Set(tokenize(t.summary)),
    body:     new Set(tokenize(body)),
  }
  return t._tokens
}

export function searchTopics(query, topics = TOPICS) {
  const q = tokenize(query)
  if (!q.length) return topics
  const scored = topics.map(t => {
    const tk = tokensFromTopic(t)
    let score = 0
    for (const term of q) {
      if (tk.title.has(term))    score += 8
      if (tk.keywords.has(term)) score += 5
      if (tk.summary.has(term))  score += 3
      if (tk.body.has(term))     score += 1
      // partial (prefix) matches in title/keywords
      for (const s of tk.title)    if (s.startsWith(term) && s !== term) { score += 2; break }
      for (const s of tk.keywords) if (s.startsWith(term) && s !== term) { score += 1; break }
    }
    return { t, score }
  }).filter(x => x.score > 0)
  scored.sort((a, b) => b.score - a.score)
  return scored.map(x => x.t)
}

export function getTopic(id) {
  return TOPICS.find(t => t.id === id) ?? null
}
