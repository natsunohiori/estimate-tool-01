import React, { useMemo, useState } from "react";

const BASE_PRICE = 5000;
const EXPRESSION_PRICE = 1000;
const COMMERCIAL_PRICE = 2500;

const RANGE_OPTIONS = {
  bustUp: 0,
  waistUp: 1500,
  thighUp: 3000,
  fullBody: 5000,
} as const;

type RangeKey = keyof typeof RANGE_OPTIONS;

const BACKGROUND_OPTIONS = {
  simple: 0,
  design: 2500,
  normalLow: 3000,
  normalHigh: 5000,
} as const;

type BackgroundKey = keyof typeof BACKGROUND_OPTIONS;

const OPTIONS = [
  { key: "animation", label: "アニメーション", price: 3000 },
  { key: "decoration", label: "装飾・小物", price: 1500 },
  { key: "characterDesign", label: "キャラクターデザイン", price: 5000 },
  { key: "costumeDesign", label: "衣装デザイン", price: 5000 },
  { key: "highRes", label: "高解像度（2000×2000px以上）", price: 1500 },
] as const;

type OptionKey = (typeof OPTIONS)[number]["key"];
type SelectedOptions = Record<OptionKey, boolean>;

const INITIAL_SELECTED_OPTIONS: SelectedOptions = {
  animation: false,
  decoration: false,
  characterDesign: false,
  costumeDesign: false,
  highRes: false,
};

function yen(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function expressionLabel(count: number): string {
  return count <= 0 ? "なし" : `${clamp(count, 0, 10)}点`;
}

function labelForRange(range: RangeKey): string {
  switch (range) {
    case "bustUp":
      return "胸上";
    case "waistUp":
      return "腰上";
    case "thighUp":
      return "太もも上";
    case "fullBody":
      return "全身";
  }
}

function labelForBackground(background: BackgroundKey): string {
  switch (background) {
    case "simple":
      return "単色・グラデ";
    case "design":
      return "デザイン背景";
    case "normalLow":
      return "背景（描写範囲少なめ）";
    case "normalHigh":
      return "背景";
  }
}

function buildEstimate(args: {
  range: RangeKey;
  peopleCount: number;
  expressionCount: number;
  background: BackgroundKey;
  selectedOptions: SelectedOptions;
  commercial: boolean;
  rush: boolean;
}) {
  const safePeople = clamp(args.peopleCount, 1, 10);
  const safeExpressions = clamp(args.expressionCount, 0, 10);
  const base = (BASE_PRICE + RANGE_OPTIONS[args.range]) * safePeople;
  const backgroundFee = BACKGROUND_OPTIONS[args.background];

  const optionsTotal = OPTIONS.reduce((sum, option) => {
    if (!args.selectedOptions[option.key]) return sum;
    if (option.key === "highRes" && args.commercial) return sum;
    return sum + option.price;
  }, 0);

  const expressionFee = safeExpressions * EXPRESSION_PRICE;
  const subtotal = base + backgroundFee + optionsTotal + expressionFee;
  const commercialFee = args.commercial ? COMMERCIAL_PRICE : 0;
  const rushFee = args.rush ? Math.floor((subtotal + commercialFee) * 0.3) : 0;

  return {
    total: subtotal + commercialFee + rushFee,
  };
}

function buildMessage(args: {
  clientName: string;
  usage: string;
  range: RangeKey;
  peopleCount: number;
  expressionCount: number;
  background: BackgroundKey;
  colorPreference: string;
  deliveryDate: string;
  portfolioPermission: string;
  selectedOptions: SelectedOptions;
  commercial: boolean;
  rush: boolean;
  notes: string;
  total: number;
}): string {
  const safePeople = clamp(args.peopleCount, 1, 10);
  const safeExpressions = clamp(args.expressionCount, 0, 10);

  const selectedOptionLabels: string[] = OPTIONS
    .filter((option) => args.selectedOptions[option.key])
    .map((option) => option.label);

  const includedItems: string[] = [...selectedOptionLabels];

  if (args.commercial) {
    includedItems.push("商用利用");
  }

  if (args.rush) {
    includedItems.push("早期納品");
  }

  const includedOptionLines =
    includedItems.length > 0
      ? includedItems.map((item) => `・${item}`)
      : ["・なし"];

  const lines: Array<string | null> = [
    args.clientName ? `${args.clientName}様` : null,
    args.clientName ? "" : null,
    "この度はご相談いただきありがとうございます。",
    "いただいた内容をもとに、概算のお見積もりをご案内いたします。",
    "",
    "【ご依頼内容】",
    `・使用用途：${args.usage || "未入力"}`,
    `・描写範囲：${labelForRange(args.range)}`,
    `・人数：${safePeople}名`,
    `・背景：${labelForBackground(args.background)}`,
    `・表情差分：${expressionLabel(safeExpressions)}`,
    "",
    "【追加項目】",
    ...includedOptionLines,
    `・お好みの配色：${args.colorPreference || "未入力"}`,
    args.deliveryDate ? `・納期：${args.deliveryDate}` : null,
    args.portfolioPermission ? `・実績公開の可否：${args.portfolioPermission}` : null,
    args.notes ? `・詳細・備考：${args.notes}` : null,
    "",
    "【概算金額】",
    `・合計：${yen(args.total)}`,
    "",
    "※ご相談内容の詳細によりましては、料金が変動することがございます。",
  ];

  return lines.filter((line): line is string => line !== null).join("\n");
}

function runTests() {
  console.assert(expressionLabel(0) === "なし", "0 should be なし");
  console.assert(expressionLabel(2) === "2点", "2 should be 2点");
  console.assert(expressionLabel(11) === "10点", "max should clamp to 10点");

  const estimate = buildEstimate({
    range: "waistUp",
    peopleCount: 2,
    expressionCount: 2,
    background: "design",
    selectedOptions: {
      animation: false,
      decoration: true,
      characterDesign: false,
      costumeDesign: false,
      highRes: true,
    },
    commercial: true,
    rush: false,
  });
  console.assert(estimate.total === 20500, "estimate should include 2 expressions and commercial fee");

  const message = buildMessage({
    clientName: "テスト",
    usage: "配信用",
    range: "waistUp",
    peopleCount: 1,
    expressionCount: 2,
    background: "design",
    colorPreference: "鮮やかな色がすき",
    deliveryDate: "5月末",
    portfolioPermission: "公開可",
    selectedOptions: {
      animation: true,
      decoration: false,
      characterDesign: false,
      costumeDesign: false,
      highRes: true,
    },
    commercial: true,
    rush: false,
    notes: "かわいい雰囲気",
    total: 14500,
  });

  console.assert(message.includes("・アニメーション"), "message should include checked option label as a line");
  console.assert(message.includes("・高解像度（2000×2000px以上）"), "message should include highRes label as a line");
  console.assert(message.includes("・商用利用"), "message should include commercial label as a line");
  console.assert(!message.includes("・早期納品"), "message should not include unchecked rush label");
}

runTests();

function Card(props: React.PropsWithChildren<{ title?: string }>) {
  return (
    <section style={styles.card}>
      {props.title ? <h2 style={styles.cardTitle}>{props.title}</h2> : null}
      {props.children}
    </section>
  );
}

function FieldLabel({ children }: React.PropsWithChildren) {
  return <div style={styles.fieldLabel}>{children}</div>;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={styles.input} />;
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...styles.textarea, ...(props.style || {}) }} />;
}

function SelectField(props: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select value={props.value} onChange={(e) => props.onChange(e.target.value)} style={styles.select}>
      {props.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function CheckboxRow(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label style={styles.checkboxRow}>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        style={styles.checkbox}
      />
      <span>{props.label}</span>
    </label>
  );
}

export default function Tool() {
  const [clientName, setClientName] = useState("");
  const [usage, setUsage] = useState("");
  const [range, setRange] = useState<RangeKey>("bustUp");
  const [background, setBackground] = useState<BackgroundKey>("simple");
  const [colorPreference, setColorPreference] = useState("鮮やかな色がすき");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [portfolioPermission, setPortfolioPermission] = useState("");
  const [peopleCount, setPeopleCount] = useState(1);
  const [expressionCount, setExpressionCount] = useState(0);
  const [commercial, setCommercial] = useState(false);
  const [rush, setRush] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>(INITIAL_SELECTED_OPTIONS);
  const [notes, setNotes] = useState("");

  const estimate = useMemo(() => {
    return buildEstimate({
      range,
      peopleCount,
      expressionCount,
      background,
      selectedOptions,
      commercial,
      rush,
    });
  }, [range, peopleCount, expressionCount, background, selectedOptions, commercial, rush]);

  const message = useMemo(() => {
    return buildMessage({
      clientName,
      usage,
      range,
      peopleCount,
      expressionCount,
      background,
      colorPreference,
      deliveryDate,
      portfolioPermission,
      selectedOptions,
      commercial,
      rush,
      notes,
      total: estimate.total,
    });
  }, [
    clientName,
    usage,
    range,
    peopleCount,
    expressionCount,
    background,
    colorPreference,
    deliveryDate,
    portfolioPermission,
    selectedOptions,
    commercial,
    rush,
    notes,
    estimate.total,
  ]);

  const toggleOption = (key: OptionKey, checked: boolean) => {
    setSelectedOptions((prev) => ({ ...prev, [key]: checked }));
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      alert("コピーしました");
    } catch {
      alert("コピーに失敗しました");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>イラスト見積もりツール🌻</h1>
        <p style={styles.headerText}>簡単に金額を確認できます。入力後、そのままDMでご相談いただけます✨</p>
      </div>

      <Card title="見積もり内容入力">
        <TextInput placeholder="依頼者名" value={clientName} onChange={(e) => setClientName(e.target.value)} />
        <TextInput placeholder="使用用途" value={usage} onChange={(e) => setUsage(e.target.value)} />

        <div>
          <FieldLabel>描写範囲</FieldLabel>
          <SelectField
            value={range}
            onChange={(value) => setRange(value as RangeKey)}
            options={[
              { value: "bustUp", label: "胸上" },
              { value: "waistUp", label: "腰上" },
              { value: "thighUp", label: "太もも上" },
              { value: "fullBody", label: "全身" },
            ]}
          />
        </div>

        <div>
          <FieldLabel>人数</FieldLabel>
          <SelectField
            value={String(peopleCount)}
            onChange={(value) => setPeopleCount(Number(value))}
            options={Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}人` }))}
          />
        </div>

        <div>
          <FieldLabel>表情差分</FieldLabel>
          <SelectField
            value={String(expressionCount)}
            onChange={(value) => setExpressionCount(Number(value))}
            options={[{ value: "0", label: "なし" }, ...Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}点` }))]}
          />
        </div>

        <div>
          <FieldLabel>背景</FieldLabel>
          <SelectField
            value={background}
            onChange={(value) => setBackground(value as BackgroundKey)}
            options={[
              { value: "simple", label: "単色・グラデ" },
              { value: "design", label: "デザイン背景" },
              { value: "normalLow", label: "背景（描写範囲少なめ）" },
              { value: "normalHigh", label: "背景" },
            ]}
          />
        </div>

        <div>
          <FieldLabel>お好みの配色</FieldLabel>
          <SelectField
            value={colorPreference}
            onChange={setColorPreference}
            options={[
              { value: "鮮やかな色がすき", label: "鮮やかな色がすき" },
              { value: "落ち着いた色がすき", label: "落ち着いた色がすき" },
            ]}
          />
        </div>

        <TextInput
          placeholder="納期（例：◯月◯日頃）"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
        />

        <TextInput
          placeholder="実績公開の可否（可能の場合いつから可能か）"
          value={portfolioPermission}
          onChange={(e) => setPortfolioPermission(e.target.value)}
        />

        <div style={styles.group}>
          {OPTIONS.map((opt) => (
            <CheckboxRow
              key={opt.key}
              checked={selectedOptions[opt.key]}
              onChange={(checked) => toggleOption(opt.key, checked)}
              label={opt.label}
            />
          ))}
        </div>

        <div style={styles.group}>
          <CheckboxRow checked={commercial} onChange={setCommercial} label="商用利用" />
          <CheckboxRow checked={rush} onChange={setRush} label="早期納品" />
        </div>

        <TextArea
          placeholder="ご相談内容や参考資料のURL、こだわりたいポイントの詳細、ご質問などご記入ください。"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Card>

      <Card title="見積もり結果">
        <div style={styles.total}>合計：{yen(estimate.total)}</div>
        <TextArea value={message} readOnly style={{ minHeight: 320 }} />
        <div>
          <button type="button" onClick={copyMessage} style={styles.copyButton}>
            コピー
          </button>
          <div style={styles.copyHint}>
            見積もり結果の文章をコピーできます。<br />
            DMでのご相談の際にお役立てください！
          </div>
          <div style={styles.xLinkWrap}>
            <span style={styles.xLabel}>X(旧Twitter)：</span>
            <a
              href="https://x.com/natsunohiori"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.xLink}
            >
              https://x.com/natsunohiori
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    gridColumn: "1 / -1",
    marginBottom: 8,
  },
  headerTitle: {
    margin: "0 0 4px 0",
    fontSize: 24,
    color: "#965209",
  },
  headerText: {
    margin: 0,
    fontSize: 14,
    color: "#6b5b4f",
  },
  page: {
    display: "grid",
    gap: 28,
    padding: 24,
    background: "#ffffff",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    fontFamily: "Arial, Hiragino Sans, Hiragino Kaku Gothic ProN, Meiryo, sans-serif",
    color: "#3f342b",
  },
  card: {
    border: "1px solid #664522",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    background: "#fff",
    padding: 24,
  },
  cardTitle: {
    margin: "0 0 16px 0",
    color: "#965209",
    fontSize: 22,
    fontWeight: 600,
  },
  fieldLabel: {
    marginBottom: 8,
    fontSize: 14,
    color: "#3f342b",
  },
  input: {
    width: "100%",
    height: 40,
    borderRadius: 8,
    border: "1px solid #664522",
    padding: "8px 12px",
    marginBottom: 16,
    background: "#fff",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    height: 40,
    borderRadius: 8,
    border: "1px solid #664522",
    padding: "8px 12px",
    marginBottom: 16,
    background: "#fff",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 8,
    border: "1px solid #664522",
    padding: "12px",
    background: "#fff",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "inherit",
    marginTop: 4,
  },
  group: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 16,
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    lineHeight: 1.2,
  },
  checkbox: {
    width: 16,
    height: 16,
    accentColor: "#965209",
  },
  total: {
    color: "#965209",
    fontWeight: 600,
    marginBottom: 16,
  },
  copyButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 10,
    border: "none",
    background: "#D1AF8A",
    color: "#fff",
    padding: "0 16px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 16,
  },
  xLinkWrap: {
    marginTop: 20,
    fontSize: 15,
    display: "block",
  },
  xLabel: {
    color: "#6b5b4f",
  },
  xLink: {
    display: "block",
    marginTop: 8,
    padding: "12px 0",
    color: "#965209",
    textDecoration: "underline",
    wordBreak: "break-all",
    fontSize: 15,
  },
  copyHint: {
    marginTop: 8,
    fontSize: 13,
    color: "#6b5b4f",
  },
};
