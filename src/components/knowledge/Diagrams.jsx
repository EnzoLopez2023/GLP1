// Stylized medical diagrams for the Knowledge Base.
// All SVGs are inline, no external deps. They scale with width and keep a
// fixed aspect ratio via viewBox.

export function GLP1MechanismDiagram() {
  return (
    <figure className="my-3">
      <svg viewBox="0 0 520 260" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="GLP-1 mechanism of action">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#0ea5e9" />
          </marker>
        </defs>

        {/* GLP-1 pen source */}
        <g>
          <rect x="20" y="110" width="70" height="22" rx="4" fill="#0ea5e9" />
          <rect x="22" y="132" width="66" height="8" rx="2" fill="#0284c7" />
          <line x1="55" y1="140" x2="55" y2="152" stroke="#374151" strokeWidth="2" />
          <text x="55" y="170" textAnchor="middle" fontSize="11" fill="#374151" fontWeight="600">GLP-1</text>
          <text x="55" y="184" textAnchor="middle" fontSize="9" fill="#6b7280">injection</text>
        </g>

        {/* Brain (satiety) */}
        <g>
          <ellipse cx="260" cy="50" rx="46" ry="28" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" />
          <path d="M 220 50 C 225 35, 295 35, 300 50" stroke="#f59e0b" strokeWidth="1.2" fill="none" />
          <text x="260" y="54" textAnchor="middle" fontSize="11" fill="#78350f" fontWeight="600">Brain</text>
          <text x="260" y="92" textAnchor="middle" fontSize="10" fill="#6b7280">↓ appetite, ↑ fullness</text>
        </g>

        {/* Pancreas */}
        <g>
          <path d="M 210 140 C 230 120, 320 120, 340 150 C 320 170, 230 170, 210 140 Z"
            fill="#fecaca" stroke="#dc2626" strokeWidth="1.5" />
          <text x="275" y="152" textAnchor="middle" fontSize="11" fill="#7f1d1d" fontWeight="600">Pancreas</text>
          <text x="275" y="186" textAnchor="middle" fontSize="10" fill="#6b7280">↑ insulin, ↓ glucagon</text>
        </g>

        {/* Stomach */}
        <g>
          <path d="M 430 110 C 470 105, 495 140, 475 175 C 455 195, 420 190, 415 160 C 413 140, 415 120, 430 110 Z"
            fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" />
          <text x="450" y="155" textAnchor="middle" fontSize="11" fill="#075985" fontWeight="600">Stomach</text>
          <text x="450" y="215" textAnchor="middle" fontSize="10" fill="#6b7280">slower emptying</text>
        </g>

        {/* Arrows from GLP-1 */}
        <path d="M 90 115 Q 170 70 215 55" stroke="#0ea5e9" strokeWidth="2" fill="none" markerEnd="url(#arr)" />
        <path d="M 90 125 Q 160 135 210 145" stroke="#0ea5e9" strokeWidth="2" fill="none" markerEnd="url(#arr)" />
        <path d="M 90 132 Q 260 210 420 165" stroke="#0ea5e9" strokeWidth="2" fill="none" markerEnd="url(#arr)" />
      </svg>
      <figcaption className="text-[11px] text-gray-500 text-center mt-1">
        GLP-1 agonists act on brain, pancreas, and stomach — reducing appetite, improving insulin response, and slowing gastric emptying.
      </figcaption>
    </figure>
  )
}

export function GlucoseCurveDiagram() {
  return (
    <figure className="my-3">
      <svg viewBox="0 0 520 220" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Postprandial glucose curve">
        {/* Axes */}
        <line x1="50" y1="180" x2="500" y2="180" stroke="#9ca3af" strokeWidth="1.5" />
        <line x1="50" y1="20"  x2="50"  y2="180" stroke="#9ca3af" strokeWidth="1.5" />

        {/* Target zone shading */}
        <rect x="50" y="120" width="450" height="40" fill="#dcfce7" opacity="0.55" />
        <text x="495" y="145" textAnchor="end" fontSize="10" fill="#166534" fontWeight="600">in-range 70–140 mg/dL</text>

        {/* High line */}
        <line x1="50" y1="80" x2="500" y2="80" stroke="#f97316" strokeDasharray="4 4" strokeWidth="1" />
        <text x="495" y="75" textAnchor="end" fontSize="10" fill="#9a3412">high &gt;180</text>

        {/* Simple carb curve (sharp spike) */}
        <path d="M 60 150 Q 120 150 150 140 Q 180 80 220 50 Q 260 40 280 70 Q 320 130 360 150 Q 420 160 495 155"
          stroke="#dc2626" strokeWidth="2.2" fill="none" />
        <circle cx="250" cy="48" r="3.5" fill="#dc2626" />
        <text x="260" y="42" fontSize="10" fill="#991b1b" fontWeight="600">simple carbs</text>

        {/* Complex carb + protein curve (gentle) */}
        <path d="M 60 155 Q 130 155 170 150 Q 220 135 270 128 Q 330 135 390 148 Q 440 155 495 155"
          stroke="#16a34a" strokeWidth="2.2" fill="none" />
        <circle cx="270" cy="128" r="3.5" fill="#16a34a" />
        <text x="280" y="122" fontSize="10" fill="#166534" fontWeight="600">balanced meal</text>

        {/* X labels */}
        <text x="60"  y="198" fontSize="10" fill="#6b7280">meal</text>
        <text x="180" y="198" fontSize="10" fill="#6b7280">+30 min</text>
        <text x="290" y="198" fontSize="10" fill="#6b7280">+1 hr</text>
        <text x="400" y="198" fontSize="10" fill="#6b7280">+2 hr</text>
        <text x="470" y="198" fontSize="10" fill="#6b7280">+3 hr</text>

        {/* Y label */}
        <text x="15" y="100" fontSize="10" fill="#6b7280" transform="rotate(-90 15 100)">glucose (mg/dL)</text>
      </svg>
      <figcaption className="text-[11px] text-gray-500 text-center mt-1">
        A rough shape of post-meal glucose. Simple carbs spike fast and high; balanced meals produce a gentler curve.
      </figcaption>
    </figure>
  )
}

export function A1CDiagram() {
  return (
    <figure className="my-3">
      <svg viewBox="0 0 520 220" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A1C and red blood cells">
        {/* Three red blood cells across a 3-month window */}
        {[80, 260, 440].map((cx, i) => (
          <g key={cx}>
            <ellipse cx={cx} cy="90" rx="52" ry="34" fill="#fca5a5" stroke="#dc2626" strokeWidth="1.5" />
            <ellipse cx={cx} cy="90" rx="22" ry="14" fill="#fecaca" stroke="#dc2626" strokeWidth="1" />
            {/* Glucose molecules attached */}
            {[...Array(3 + i * 2)].map((_, j) => {
              const ang = (j / (3 + i * 2)) * Math.PI * 2
              const x = cx + Math.cos(ang) * 45
              const y = 90 + Math.sin(ang) * 28
              return <circle key={j} cx={x} cy={y} r="4" fill="#0ea5e9" stroke="#0369a1" strokeWidth="1" />
            })}
            <text x={cx} y="150" textAnchor="middle" fontSize="11" fill="#374151" fontWeight="600">
              Month {i + 1}
            </text>
          </g>
        ))}

        {/* Timeline arrow */}
        <line x1="40" y1="180" x2="490" y2="180" stroke="#0ea5e9" strokeWidth="2" markerEnd="url(#tArr)" />
        <defs>
          <marker id="tArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#0ea5e9" />
          </marker>
        </defs>
        <text x="260" y="205" textAnchor="middle" fontSize="11" fill="#0369a1" fontWeight="600">
          ~3-month red blood cell lifespan = A1C window
        </text>
      </svg>
      <figcaption className="text-[11px] text-gray-500 text-center mt-1">
        A1C measures the % of red blood cells coated with glucose, averaged over the cells' ~3-month lifespan.
      </figcaption>
    </figure>
  )
}

export function CarbAbsorptionDiagram() {
  return (
    <figure className="my-3">
      <svg viewBox="0 0 520 220" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Carb absorption timeline">
        {/* Mouth → stomach → small intestine → bloodstream */}
        <g>
          <circle cx="70"  cy="110" r="28" fill="#fde68a" stroke="#d97706" strokeWidth="1.5" />
          <text x="70"  y="114" textAnchor="middle" fontSize="10" fontWeight="600" fill="#7c2d12">Mouth</text>
          <text x="70"  y="160" textAnchor="middle" fontSize="9" fill="#6b7280">chew / amylase</text>

          <circle cx="190" cy="110" r="28" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" />
          <text x="190" y="114" textAnchor="middle" fontSize="10" fontWeight="600" fill="#075985">Stomach</text>
          <text x="190" y="160" textAnchor="middle" fontSize="9" fill="#6b7280">acid / mix</text>

          <circle cx="310" cy="110" r="28" fill="#ddd6fe" stroke="#6d28d9" strokeWidth="1.5" />
          <text x="310" y="108" textAnchor="middle" fontSize="10" fontWeight="600" fill="#4c1d95">Small</text>
          <text x="310" y="120" textAnchor="middle" fontSize="10" fontWeight="600" fill="#4c1d95">intestine</text>
          <text x="310" y="160" textAnchor="middle" fontSize="9" fill="#6b7280">absorb glucose</text>

          <circle cx="440" cy="110" r="28" fill="#fecaca" stroke="#dc2626" strokeWidth="1.5" />
          <text x="440" y="108" textAnchor="middle" fontSize="10" fontWeight="600" fill="#7f1d1d">Blood</text>
          <text x="440" y="120" textAnchor="middle" fontSize="10" fontWeight="600" fill="#7f1d1d">stream</text>
          <text x="440" y="160" textAnchor="middle" fontSize="9" fill="#6b7280">glucose rises</text>

          {/* arrows */}
          <line x1="100" y1="110" x2="160" y2="110" stroke="#374151" strokeWidth="2" markerEnd="url(#cArr)" />
          <line x1="220" y1="110" x2="280" y2="110" stroke="#374151" strokeWidth="2" markerEnd="url(#cArr)" />
          <line x1="340" y1="110" x2="410" y2="110" stroke="#374151" strokeWidth="2" markerEnd="url(#cArr)" />

          <defs>
            <marker id="cArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#374151" />
            </marker>
          </defs>
        </g>

        {/* Label */}
        <text x="260" y="30" textAnchor="middle" fontSize="12" fill="#374151" fontWeight="600">How carbs turn into blood sugar</text>
        <text x="260" y="200" textAnchor="middle" fontSize="10" fill="#6b7280">
          Fiber, fat, and protein slow this process; simple sugars shortcut it.
        </text>
      </svg>
    </figure>
  )
}

export function PlateDiagram() {
  return (
    <figure className="my-3">
      <svg viewBox="0 0 400 260" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Balanced GLP-1 plate">
        <circle cx="200" cy="130" r="115" fill="#ffffff" stroke="#9ca3af" strokeWidth="2" />

        {/* Half plate: non-starchy veg */}
        <path d="M 200 15 A 115 115 0 0 0 200 245 Z" fill="#bbf7d0" />
        <text x="135" y="135" textAnchor="middle" fontSize="12" fontWeight="700" fill="#166534">½ plate</text>
        <text x="135" y="152" textAnchor="middle" fontSize="11" fill="#166534">non-starchy</text>
        <text x="135" y="166" textAnchor="middle" fontSize="11" fill="#166534">vegetables</text>

        {/* Quarter: protein */}
        <path d="M 200 15 A 115 115 0 0 1 315 130 L 200 130 Z" fill="#fecaca" />
        <text x="255" y="75" textAnchor="middle" fontSize="12" fontWeight="700" fill="#7f1d1d">¼ plate</text>
        <text x="255" y="92" textAnchor="middle" fontSize="11" fill="#7f1d1d">protein</text>

        {/* Quarter: slow carbs */}
        <path d="M 315 130 A 115 115 0 0 1 200 245 L 200 130 Z" fill="#fde68a" />
        <text x="255" y="185" textAnchor="middle" fontSize="12" fontWeight="700" fill="#78350f">¼ plate</text>
        <text x="255" y="202" textAnchor="middle" fontSize="11" fill="#78350f">slow carbs</text>

        {/* Center label */}
        <circle cx="200" cy="130" r="8" fill="#ffffff" stroke="#9ca3af" />
      </svg>
      <figcaption className="text-[11px] text-gray-500 text-center mt-1">
        A simple GLP-1-friendly plate: half vegetables, a quarter protein, a quarter slow-digesting carbs.
      </figcaption>
    </figure>
  )
}

export function SpikeTypesDiagram() {
  return (
    <figure className="my-3">
      <svg viewBox="0 0 520 220" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Temporary vs lasting glucose elevation">
        <line x1="50" y1="180" x2="500" y2="180" stroke="#9ca3af" strokeWidth="1.5" />
        <line x1="50" y1="20"  x2="50"  y2="180" stroke="#9ca3af" strokeWidth="1.5" />

        <rect x="50" y="130" width="450" height="30" fill="#dcfce7" opacity="0.55" />
        <text x="495" y="150" textAnchor="end" fontSize="10" fill="#166534" fontWeight="600">target range</text>

        {/* Temporary spike */}
        <path d="M 60 155 Q 100 150 130 140 Q 170 60 210 70 Q 250 120 300 150 Q 360 160 495 155"
          stroke="#f97316" strokeWidth="2.2" fill="none" />
        <text x="170" y="55" fontSize="11" fontWeight="600" fill="#9a3412">temporary spike (meal)</text>

        {/* Sustained elevation */}
        <path d="M 60 110 L 120 105 L 200 108 L 280 102 L 380 110 L 495 106"
          stroke="#dc2626" strokeWidth="2.2" fill="none" />
        <text x="260" y="100" textAnchor="middle" fontSize="11" fontWeight="600" fill="#991b1b">
          sustained elevation (days/weeks)
        </text>

        <text x="70" y="198" fontSize="10" fill="#6b7280">now</text>
        <text x="250" y="198" fontSize="10" fill="#6b7280">hours/days →</text>
      </svg>
      <figcaption className="text-[11px] text-gray-500 text-center mt-1">
        A temporary spike returns to baseline within hours. Sustained elevation is glucose that stays high across days or weeks.
      </figcaption>
    </figure>
  )
}
