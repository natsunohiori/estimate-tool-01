import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, ChevronUp, ChevronDown } from "lucide-react";

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

function peopleLabel(count: number): string {
  return `${clamp(count, 1, 10)}人`;
}

function expressionLabel(count: number): string {
  return count <= 0 ? "なし" : `${clamp(count, 0, 30)}つ`;
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
  const safeExpressions = clamp(args.expressionCount, 0, 30);
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
  const total = subtotal + commercialFee + rushFee;

  return {
    base,
    backgroundFee,
    optionsTotal,
    expressionFee,
    subtotal,
    commercialFee,
    rushFee,
    total,
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
  portfolioPermission: string;
  commercial: boolean;
  rush: boolean;
  notes: string;
  total: number;
}): string {
  const lines: Array<string | null> = [
    args.clientName ? `${args.clientName}様` : "",
    args.clientName ? "" : null,
    "この度はご相談いただきありがとうございます。",
    "ご依頼内容をもとに、概算のお見積もりをご案内いたします。",
    "",
    "【ご依頼内容】",
    `・使用用途：${args.usage || "未入力"}`,
    `・描写範囲：${labelForRange(args.range)}`,
    `・人数：${clamp(args.peopleCount, 1, 10)}名`,
    `・表情差分：${expressionLabel(args.expressionCount)}`,
    `・背景：${labelForBackground(args.background)}`,
    `・お好みの配色：${args.colorPreference}`,
    args.portfolioPermission ? `・実績公開の可否：${args.portfolioPermission}` : null,
    args.commercial ? "・商用利用あり" : null,
    args.rush ? "・早期納品あり" : null,
    args.notes ? `・詳細：${args.notes}` : null,
    "",
    "【概算金額】",
    `合計：${yen(args.total)}`,
    "",
    "※上記は概算となります。",
    "",
    "こちらの内容をコピーして、XのDMやDiscordのメッセージからぜひご相談ください。",
  ];

  return lines.filter((line): line is string => line !== null).join("\n");
}

function runTests() {
  console.assert(peopleLabel(1) === "1人", "peopleLabel should format 1人");
  console.assert(peopleLabel(12) === "10人", "peopleLabel should clamp to 10人");
  console.assert(expressionLabel(0) === "なし", "expressionLabel should format なし");
  console.assert(expressionLabel(2) === "2つ", "expressionLabel should format 2つ");
  console.assert(expressionLabel(31) === "30つ", "expressionLabel should clamp to 30つ");

  const baseEstimate = buildEstimate({
    range: "bustUp",
    peopleCount: 1,
    expressionCount: 0,
    background: "simple",
    selectedOptions: INITIAL_SELECTED_OPTIONS,
    commercial: false,
    rush: false,
  });
  console.assert(baseEstimate.total === 5000, "base estimate should be 5000");

  const commercialEstimate = buildEstimate({
    range: "waistUp",
    peopleCount: 2,
    expressionCount: 1,
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
  console.assert(
    commercialEstimate.total === 18500,
    "commercial estimate should exclude highRes and add fixed fee"
  );

  const rushEstimate = buildEstimate({
    range: "fullBody",
    peopleCount: 1,
    expressionCount: 2,
    background: "normalHigh",
    selectedOptions: {
      animation: true,
      decoration: false,
      characterDesign: false,
      costumeDesign: false,
      highRes: false,
    },
    commercial: false,
    rush: true,
  });
  console.assert(rushEstimate.total === 19500, "rush estimate should include 30 percent fee");

  const message = buildMessage({
    clientName: "",
    usage: "SNSアイコン",
    range: "bustUp",
    peopleCount: 1,
    expressionCount: 0,
    background: "simple",
    colorPreference: "鮮やかな色がすき",
    portfolioPermission: "4月以降可能",
    commercial: false,
    rush: false,
    notes: "参考資料あり",
    total: 5000,
  });
  console.assert(message.includes("実績公開の可否：4月以降可能"), "message should include portfolio permission");
  console.assert(message.includes("お好みの配色：鮮やかな色がすき"), "message should include color preference");
}

runTests();

function StepperField(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const { label, value, min, max, format, onChange } = props;
  const safeValue = clamp(value, min, max);

  const decrease = () => onChange(clamp(safeValue - 1, min, max));
  const increase = () => onChange(clamp(safeValue + 1, min, max));

  return (
    <div className="space-y-2">
      <div className="text-sm text-slate-700">{label}</div>
      <div className="flex h-10 w-full items-center justify-between rounded-md border border-[#664522] bg-background px-3 text-sm ring-offset-background">
        <span>{format(safeValue)}</span>
        <div className="ml-3 flex flex-col gap-[1px]">
          <button
            type="button"
            aria-label={`${label}を増やす`}
            className="flex h-4 w-5 items-center justify-center rounded-sm hover:bg-orange-50"
            onClick={increase}
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label={`${label}を減らす`}
            className="flex h-4 w-5 items-center justify-center rounded-sm hover:bg-orange-50"
            onClick={decrease}
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Tool() {
  const [clientName, setClientName] = useState("");
  const [usage, setUsage] = useState("");
  const [range, setRange] = useState<RangeKey>("bustUp");
  const [background, setBackground] = useState<BackgroundKey>("simple");
  const [colorPreference, setColorPreference] = useState("鮮やかな色がすき");
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
      portfolioPermission,
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
    portfolioPermission,
    commercial,
    rush,
    notes,
    estimate.total,
  ]);

  const handleRangeChange = (value: string) => {
    setRange(value as RangeKey);
  };

  const handleBackgroundChange = (value: string) => {
    setBackground(value as BackgroundKey);
  };

  const handleColorPreferenceChange = (value: string) => {
    setColorPreference(value);
  };

  const toggleOption = (key: OptionKey, checked: boolean) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message);
  };

  return (
    <div className="grid gap-6 bg-white p-6 lg:grid-cols-2">
      <Card className="border border-[#664522] shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#965209]">見積もり内容入力</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            className="flex h-10 w-full rounded-md border border-[#664522] bg-background px-3 py-2 text-sm ring-offset-background"
            placeholder="依頼者名"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />

          <input
            className="flex h-10 w-full rounded-md border border-[#664522] bg-background px-3 py-2 text-sm ring-offset-background"
            placeholder="使用用途"
            value={usage}
            onChange={(e) => setUsage(e.target.value)}
          />

          <Select value={range} onValueChange={handleRangeChange}>
            <SelectTrigger className="border border-[#664522] bg-background">
              <SelectValue placeholder="描写範囲を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bustUp">胸上</SelectItem>
              <SelectItem value="waistUp">腰上</SelectItem>
              <SelectItem value="thighUp">太もも上</SelectItem>
              <SelectItem value="fullBody">全身</SelectItem>
            </SelectContent>
          </Select>

          <StepperField
            label="人数"
            value={peopleCount}
            min={1}
            max={10}
            format={peopleLabel}
            onChange={setPeopleCount}
          />

          <StepperField
            label="表情差分"
            value={expressionCount}
            min={0}
            max={30}
            format={expressionLabel}
            onChange={setExpressionCount}
          />

          <Select value={background} onValueChange={handleBackgroundChange}>
            <SelectTrigger className="border border-[#664522] bg-background">
              <SelectValue placeholder="背景を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">単色・グラデ</SelectItem>
              <SelectItem value="design">デザイン背景</SelectItem>
              <SelectItem value="normalLow">背景（描写範囲少なめ）</SelectItem>
              <SelectItem value="normalHigh">背景</SelectItem>
            </SelectContent>
          </Select>

          <Select value={colorPreference} onValueChange={handleColorPreferenceChange}>
            <SelectTrigger className="border border-[#664522] bg-background">
              <SelectValue placeholder="お好みの配色" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="鮮やかな色がすき">鮮やかな色がすき</SelectItem>
              <SelectItem value="落ち着いた色がすき">落ち着いた色がすき</SelectItem>
            </SelectContent>
          </Select>

          <input
            className="flex h-10 w-full rounded-md border border-[#664522] bg-background px-3 py-2 text-sm ring-offset-background"
            placeholder="実績公開の可否（可能の場合いつから可能か）"
            value={portfolioPermission}
            onChange={(e) => setPortfolioPermission(e.target.value)}
          />

          <div className="flex flex-col gap-3">
            {OPTIONS.map((opt) => (
              <label key={opt.key} className="flex items-center gap-2 leading-none">
                <Checkbox
                  checked={selectedOptions[opt.key]}
                  onCheckedChange={(checked) => toggleOption(opt.key, Boolean(checked))}
                />
                {opt.label}
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 leading-none">
              <Checkbox
                checked={commercial}
                onCheckedChange={(checked) => setCommercial(Boolean(checked))}
              />
              商用利用
            </label>
            <label className="flex items-center gap-2 leading-none">
              <Checkbox checked={rush} onCheckedChange={(checked) => setRush(Boolean(checked))} />
              早期納品
            </label>
          </div>

          <Textarea
            className="border border-[#664522] bg-background"
            placeholder="ご相談内容や参考資料のURL、こだわりたいポイントの詳細、ご質問などご記入ください。"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card className="border border-[#664522] shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#965209]">見積もり結果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="font-medium text-[#965209]">合計：{yen(estimate.total)}</div>
          <Textarea value={message} readOnly className="min-h-[320px] border border-[#664522] bg-background" />
          <Button onClick={copyMessage} className="bg-[#D1AF8A] text-white hover:bg-[#965209]">
            <Copy className="mr-2 h-4 w-4" />
            コピー
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
