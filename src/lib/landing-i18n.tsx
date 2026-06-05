"use client";

import {
  createContext, useContext, useEffect, useState, useCallback, type ReactNode,
} from "react";

//
// Bilingual i18n for the SnapAha landing page (EN / VI)
// - Auto-detects system language via navigator.language
// - Persists the user's manual choice in localStorage
// - Zero dependencies; one React context + a useT() hook
//

export type Lang = "en" | "vi";

const STORAGE_KEY = "snapaha-lang";

// Detect language from the visitor's browser / OS
function detectLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "vi") return saved;
  } catch { /* ignore */ }
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  return langs.some((l) => l?.toLowerCase().startsWith("vi")) ? "vi" : "en";
}

// Dictionary shape
export interface Dict {
  nav: { features: string; how: string; useCases: string; pricing: string; download: string };
  hero: {
    badge: (q: string) => string;
    free: string;
    line1: string;
    line2: string;
    sub: string;
    cta: string;
    secondary: string;
    trust: string;
    rating: string;
    usersLove: string;
    flow: [string, string, string];
  };
  demo: {
    eyebrow: string;
    head: string;
    sub: string;
    shortcut: string;
    windowApp: string;
    code: string[];
    selectHint: string;
    thinking: string;
    tryHint: string;
    replay: string;
    ahaShort: string;
    actions: { label: string; answer: string }[];
  };
  beta: {
    badge: string;
    joined: (n: string) => string;
    closesIn: { a: string; b: string };
    freeLimited: { a: string; b: string };
    perks: string[];
    cta: string;
    fine: string;
    days: string; hours: string; mins: string; secs: string;
  };
  problem: {
    eyebrow: string;
    headPre: string; headPost: string; daysUnit: string;
    sub: { a: string; bold: string; b: string };
    without: string; withApp: string;
    withoutSteps: string[]; withSteps: string[];
    withoutTime: string; withTime: string;
  };
  how: { eyebrow: string; head: string; steps: { title: string; desc: string }[] };
  features: { eyebrow: string; head1: string; head2: string; items: { badge?: string; title: string; desc: string }[] };
  useCases: { eyebrow: string; head1: string; head2: string; quickActions: string; cases: UseCaseT[] };
  social: {
    stats: { label: string }[];
    testimonials: { q: string; a: string; r: string }[];
  };
  pricing: {
    eyebrow: string; head: string; sub: string;
    plans: { plan: string; period: string; cta: string; badge?: string; features: string[] }[];
  };
  footerCta: { line1: string; line2: string; sub: string; cta: string; fine: string };
  footer: { tagline: string; links: string[]; admin: string; rights: string };
}

export interface UseCaseT { highlight: string; story: string; actions: string[]; label: string }

// English
const en: Dict = {
  nav: { features: "Features", how: "How it works", useCases: "Use cases", pricing: "Pricing", download: "Download Free" },
  hero: {
    badge: (q) => `Public beta · ${q} queries answered`,
    free: "FREE",
    line1: "Stuck anywhere?",
    line2: "Clear everywhere.",
    sub: "A tricky paragraph. A word you don't know. An email you're not sure how to answer. Highlight it and understand it in one second, right where you are. No tabs, no copy-paste.",
    cta: "Download for Windows · Free",
    secondary: "Try the live demo",
    trust: "Windows 10/11 · No sign-up · No credit card",
    rating: "4.8 / 5",
    usersLove: "loved by 12,000+ users",
    flow: ["See it", "Snap it", "Get it"],
  },
  demo: {
    eyebrow: "Try it right here",
    head: "Feel the “aha” before you download",
    sub: "This is exactly how it feels. Highlight anything you don't understand, and watch it click in one second.",
    shortcut: "Press Ctrl + Shift + Space",
    windowApp: "Biology 101 · Chapter 4.pdf",
    code: [
      "The mitochondrion is the powerhouse of",
      "the cell, generating most of the supply",
      "of adenosine triphosphate (ATP), used",
      "as a source of chemical energy for",
      "cellular respiration and metabolism.",
    ],
    selectHint: "Drag to highlight what's confusing",
    thinking: "SnapAha is reading your screen…",
    tryHint: "Pick an action, the AI answers instantly",
    replay: "Replay",
    ahaShort: "Mitochondria = your cells' power source",
    actions: [
      { label: "Explain simply", answer: "In plain words: mitochondria are the tiny “batteries” inside your cells. They turn the food you eat into ATP, the energy that powers everything your body does." },
      { label: "Make flashcards", answer: "Q: What do mitochondria make?\nA: ATP, the cell's energy.\n\nQ: Their nickname?\nA: “The powerhouse of the cell.”" },
      { label: "Translate", answer: "Ty thể là “nhà máy điện” của tế bào, tạo ra phần lớn ATP, nguồn năng lượng hoá học cho hô hấp và trao đổi chất của tế bào." },
    ],
  },
  beta: {
    badge: "EARLY ACCESS BETA",
    joined: (n) => `${n} joined`,
    closesIn: { a: "Beta access closes", b: "in" },
    freeLimited: { a: "Free access,", b: "limited time." },
    perks: ["100% free during beta", "Early-adopter badge at v1.0", "Unlimited queries & features", "Shape the product directly"],
    cta: "Download for Windows · Free",
    fine: "Windows 10/11 · No sign-up · No credit card",
    days: "Days", hours: "Hours", mins: "Mins", secs: "Secs",
  },
  problem: {
    eyebrow: "Sound familiar?",
    headPre: "Every year you lose", headPost: "just looking things up", daysUnit: " days",
    sub: { a: "A dozen little stops a day × 60 seconds each × 250 days = ", bold: "over 200 hours", b: ". And that's before the effort of finding your place and your focus again." },
    without: "The old way", withApp: "With SnapAha",
    withoutSteps: ["Stop reading or writing", "Open a new browser tab", "Go to Google Translate or ChatGPT", "Type or paste the text in", "Wait, read, piece it together", "Find where you left off"],
    withSteps: ["Highlight what you're stuck on", "Press Ctrl+Shift+Space", "Read the answer, keep going"],
    withoutTime: "30 to 90 seconds · train of thought lost", withTime: "Under 5 seconds · never leave the page",
  },
  how: {
    eyebrow: "3 steps · under 5 seconds",
    head: "Instant AI. Zero friction.",
    steps: [
      { title: "Press the shortcut", desc: "Ctrl+Shift+Space from any app: IDE, browser, PDF, terminal, even a game." },
      { title: "Select any area", desc: "Drag over text, code, an image or video. Any pixel on your screen works." },
      { title: "Get an instant answer", desc: "The AI reads it with OCR + Vision and streams the answer in a window right beside you." },
    ],
  },
  features: {
    eyebrow: "Features",
    head1: "Everything your AI", head2: "needs to keep up",
    items: [
      { badge: "Core", title: "Screenshot → answer", desc: "Reads any PDF, slide, video or locked app. See it, ask it." },
      { badge: "5 profiles", title: "A profile for every you", desc: "Study Buddy, Office Pro, Language Coach. Switch in one click." },
      { title: "QuickChat, always on hand", desc: "A floating mini-chat that never leaves. Type, drop an image, ask." },
      { title: "Everything you asked, saved", desc: "Every question and answer kept and searchable. Your study log." },
      { title: "Learns your habits", desc: "Your most-used actions float to the top. Always one click away." },
      { badge: "Power user", title: "Connects to your tools", desc: "Goes beyond answers. It searches the web, reads files for you." },
    ],
  },
  useCases: {
    eyebrow: "For every workflow",
    head1: "Built for how you", head2: "actually work",
    quickActions: "Quick actions",
    cases: [
      { label: "Student", highlight: "Study 3× faster, stress less", story: `One paragraph just won't click. Highlight it, hit "Explain simply". It makes sense in seconds. Then turn it into flashcards.`, actions: ["Explain simply", "Make flashcards", "Translate", "Quiz me"] },
      { label: "Office", highlight: "Look sharp in 15 seconds", story: `A formal English email lands. Highlight it, hit "Draft reply". A polished, on-tone response, ready to send. You look like a pro.`, actions: ["Draft reply", "Translate", "Summarize report", "Fix the tone"] },
      { label: "Creator", highlight: "Always your own voice", story: `You spot a line you love from someone else. Highlight it, hit "Rewrite in my voice". Now it's yours. Inspired, never copied.`, actions: ["Rewrite", "Improve tone", "Headline ideas", "Grammar check"] },
      { label: "Developer", highlight: "Yes, it does code too", story: `A wall of red in the terminal. Highlight it, hit "Explain error". Root cause and a fix, right there. A nice bonus.`, actions: ["Explain error", "Fix code", "Search docs", "Review PR"] },
    ],
  },
  social: {
    stats: [{ label: "Beta users" }, { label: "Queries answered" }, { label: "App rating" }, { label: "Day-7 retention" }],
    testimonials: [
      { q: "I use SnapAha 40 to 50 times a day. It feels like a second brain that's always awake and never breaks my flow.", a: "Minh T.", r: "Senior Backend Engineer" },
      { q: "I read 10 papers a day as a researcher. Summarize + Flashcards cut my reading time by 40%, and switching profiles is incredible.", a: "Thu N.", r: "PhD Candidate, CS" },
      { q: "The Office Pro profile writes emails better than I do. Polite, firm, professional. I use it for every tricky reply.", a: "Lan P.", r: "Project Manager" },
    ],
  },
  pricing: {
    eyebrow: "Pricing",
    head: "Start free. Upgrade when you're ready.",
    sub: "No credit card required · Cancel anytime",
    plans: [
      { plan: "Free", period: "", cta: "Download Free", features: ["50 queries / month", "2 AI profiles", "Basic commands", "7-day history", "Windows"] },
      { plan: "Pro", period: "/mo", cta: "Start Pro trial", badge: "Most popular", features: ["Unlimited queries", "5 profiles + custom", "All MCP tools", "Claude Sonnet & GPT-4o", "Unlimited history", "Priority support"] },
      { plan: "Team", period: "/user/mo", cta: "Contact sales", features: ["Everything in Pro", "Shared team profiles", "Analytics dashboard", "Admin controls + SSO", "Dedicated support"] },
    ],
  },
  footerCta: {
    line1: "Stop switching tabs.", line2: "Start doing.",
    sub: "See something. Ask the AI instantly. Right on your screen.",
    cta: "Download SnapAha for Windows · Free",
    fine: "Windows 10/11 · No sign-up required",
  },
  footer: {
    tagline: "See something. Ask the AI instantly.",
    links: ["Privacy", "Terms", "Support", "Blog", "Changelog"],
    admin: "Admin",
    rights: "© 2026 SnapAha. All rights reserved.",
  },
};

// Vietnamese (natural, native phrasing, not literal)
const vi: Dict = {
  nav: { features: "Tính năng", how: "Cách dùng", useCases: "Ứng dụng", pricing: "Bảng giá", download: "Tải miễn phí" },
  hero: {
    badge: (q) => `Bản beta công khai · đã giải đáp ${q} câu hỏi`,
    free: "MIỄN PHÍ",
    line1: "Bí chỗ nào?",
    line2: "Sáng chỗ đó.",
    sub: "Một đoạn khó nhằn. Một từ lạ hoắc. Một email chẳng biết trả lời sao. Bôi đen nó và hiểu ngay trong một giây, ngay tại chỗ bạn đang làm. Không đổi tab, không copy-paste.",
    cta: "Tải cho Windows · Miễn phí",
    secondary: "Dùng thử ngay",
    trust: "Windows 10/11 · Không cần đăng ký · Không cần thẻ",
    rating: "4.8 / 5",
    usersLove: "hơn 12.000 người đang dùng",
    flow: ["Nhìn thấy", "Bôi đen", "Hiểu ngay"],
  },
  demo: {
    eyebrow: "Thử ngay tại đây",
    head: "Cảm nhận khoảnh khắc “à, ra vậy!” trước khi tải",
    sub: "Đây đúng là cảm giác khi dùng SnapAha. Bôi đen chỗ nào không hiểu, và thấy nó sáng tỏ ngay trong một giây.",
    shortcut: "Nhấn Ctrl + Shift + Space",
    windowApp: "Sinh học 101 · Chương 4.pdf",
    code: [
      "The mitochondrion is the powerhouse of",
      "the cell, generating most of the supply",
      "of adenosine triphosphate (ATP), used",
      "as a source of chemical energy for",
      "cellular respiration and metabolism.",
    ],
    selectHint: "Kéo để bôi đen chỗ khó hiểu",
    thinking: "SnapAha đang đọc màn hình của bạn…",
    tryHint: "Chọn một thao tác, AI trả lời ngay",
    replay: "Xem lại",
    ahaShort: "Ty thể = nguồn năng lượng của tế bào",
    actions: [
      { label: "Giải thích dễ hiểu", answer: "Nói đơn giản: ty thể là những “cục pin” tí hon trong tế bào. Chúng biến thức ăn bạn nạp vào thành ATP, nguồn năng lượng vận hành mọi hoạt động của cơ thể." },
      { label: "Tạo flashcard", answer: "Hỏi: Ty thể tạo ra gì?\nĐáp: ATP, năng lượng của tế bào.\n\nHỏi: Biệt danh của nó?\nĐáp: “Nhà máy điện của tế bào.”" },
      { label: "Dịch sang tiếng Việt", answer: "Ty thể là “nhà máy điện” của tế bào, tạo ra phần lớn ATP, nguồn năng lượng hoá học cho hô hấp và trao đổi chất của tế bào." },
    ],
  },
  beta: {
    badge: "TRUY CẬP SỚM · BETA",
    joined: (n) => `${n} người đã tham gia`,
    closesIn: { a: "Truy cập beta sẽ đóng", b: "sau" },
    freeLimited: { a: "Miễn phí,", b: "có thời hạn." },
    perks: ["Miễn phí 100% trong giai đoạn beta", "Huy hiệu người dùng tiên phong khi lên v1.0", "Không giới hạn câu hỏi & tính năng", "Cùng góp ý định hình sản phẩm"],
    cta: "Tải cho Windows · Miễn phí",
    fine: "Windows 10/11 · Không cần đăng ký · Không cần thẻ",
    days: "Ngày", hours: "Giờ", mins: "Phút", secs: "Giây",
  },
  problem: {
    eyebrow: "Nghe quen không?",
    headPre: "Mỗi năm bạn mất", headPost: "chỉ để tra cứu", daysUnit: " ngày",
    sub: { a: "Cả chục lần khựng lại mỗi ngày × 60 giây × 250 ngày = ", bold: "hơn 200 giờ", b: ". Chưa kể công sức tìm lại chỗ cũ và lấy lại sự tập trung." },
    without: "Cách cũ", withApp: "Khi có SnapAha",
    withoutSteps: ["Ngừng đọc hoặc đang viết dở", "Mở thêm một tab mới", "Vào Google Dịch hoặc ChatGPT", "Gõ lại hoặc dán nội dung vào", "Chờ, đọc, rồi tự ghép nghĩa", "Tìm lại chỗ vừa đọc dở"],
    withSteps: ["Bôi đen chỗ đang bí", "Nhấn Ctrl+Shift+Space", "Đọc câu trả lời, làm tiếp"],
    withoutTime: "30 đến 90 giây · đứt mạch suy nghĩ", withTime: "Dưới 5 giây · không rời trang",
  },
  how: {
    eyebrow: "3 bước · dưới 5 giây",
    head: "AI tức thì. Không vướng bận.",
    steps: [
      { title: "Nhấn phím tắt", desc: "Ctrl+Shift+Space ở bất kỳ ứng dụng nào: IDE, trình duyệt, PDF, terminal, kể cả game." },
      { title: "Khoanh vùng bất kỳ", desc: "Kéo chọn văn bản, đoạn mã, hình ảnh hay video. Mọi điểm ảnh trên màn hình đều được." },
      { title: "Nhận câu trả lời ngay", desc: "AI đọc bằng OCR + Vision rồi trả lời ngay trong một cửa sổ nổi bên cạnh bạn." },
    ],
  },
  features: {
    eyebrow: "Tính năng",
    head1: "Mọi thứ để AI của bạn", head2: "luôn theo kịp",
    items: [
      { badge: "Cốt lõi", title: "Chụp màn hình → có câu trả lời", desc: "Đọc mọi PDF, slide, video hay app đang khoá. Thấy là hỏi được." },
      { badge: "5 hồ sơ", title: "Một hồ sơ cho mỗi kiểu bạn", desc: "Study Buddy, Office Pro, Language Coach. Đổi bằng một cú nhấp." },
      { title: "QuickChat luôn trong tầm tay", desc: "Khung chat mini luôn nổi trên màn hình. Gõ, thả ảnh, hỏi tiếp." },
      { title: "Hỏi gì cũng được lưu lại", desc: "Mọi câu hỏi và trả lời đều được lưu, tìm lại trong một giây." },
      { title: "Học theo thói quen của bạn", desc: "Thao tác hay dùng tự nổi lên đầu. Luôn cách đúng một cú nhấp." },
      { badge: "Nâng cao", title: "Kết nối với công cụ của bạn", desc: "Không chỉ trả lời. Còn tìm web và đọc tệp giúp bạn." },
    ],
  },
  useCases: {
    eyebrow: "Cho mọi công việc",
    head1: "Tạo ra cho đúng cách", head2: "bạn vẫn làm việc",
    quickActions: "Thao tác nhanh",
    cases: [
      { label: "Sinh viên", highlight: "Học nhanh gấp 3, bớt căng thẳng", story: `Một đoạn cứ đọc mãi không vô. Bôi đen, bấm "Giải thích dễ hiểu". Vài giây sau là thông. Rồi biến luôn thành flashcard.`, actions: ["Giải thích dễ hiểu", "Tạo flashcard", "Dịch", "Kiểm tra tôi"] },
      { label: "Văn phòng", highlight: "Chuyên nghiệp trong 15 giây", story: `Một email tiếng Anh trang trọng vừa tới. Bôi đen, bấm "Soạn phản hồi". Bản trả lời chỉn chu, đúng giọng, sẵn để gửi. Ra dáng dân chuyên.`, actions: ["Soạn phản hồi", "Dịch", "Tóm tắt báo cáo", "Chỉnh giọng văn"] },
      { label: "Sáng tạo", highlight: "Luôn đúng chất của bạn", story: `Bạn thấy một câu của người khác hay quá. Bôi đen, bấm "Viết lại theo giọng của tôi". Giờ nó là của bạn. Lấy cảm hứng, không sao chép.`, actions: ["Viết lại", "Chỉnh giọng văn", "Gợi ý tiêu đề", "Soát ngữ pháp"] },
      { label: "Lập trình viên", highlight: "Ừ, code nó cũng làm được", story: `Cả màn hình đỏ lỗi. Bôi đen, bấm "Giải thích lỗi". Nguyên nhân gốc và cách sửa, ngay tại chỗ. Một điểm cộng dễ chịu.`, actions: ["Giải thích lỗi", "Sửa code", "Tra tài liệu", "Soát PR"] },
    ],
  },
  social: {
    stats: [{ label: "Người dùng beta" }, { label: "Câu hỏi đã giải đáp" }, { label: "Điểm đánh giá" }, { label: "Giữ chân ngày 7" }],
    testimonials: [
      { q: "Tôi dùng SnapAha 40 đến 50 lần mỗi ngày. Cứ như có thêm một bộ não luôn thức và không bao giờ làm đứt mạch làm việc của tôi.", a: "Minh T.", r: "Kỹ sư Backend cấp cao" },
      { q: "Mỗi ngày tôi đọc 10 bài báo. Tính năng Tóm tắt + Flashcard giảm 40% thời gian đọc, và việc đổi hồ sơ thì quá đỉnh.", a: "Thu N.", r: "Nghiên cứu sinh, CNTT" },
      { q: "Hồ sơ Office Pro viết email còn khéo hơn tôi. Lịch sự, dứt khoát, chuyên nghiệp. Email nào khó tôi cũng nhờ nó.", a: "Lan P.", r: "Quản lý dự án" },
    ],
  },
  pricing: {
    eyebrow: "Bảng giá",
    head: "Bắt đầu miễn phí. Nâng cấp khi bạn sẵn sàng.",
    sub: "Không cần thẻ tín dụng · Huỷ bất cứ lúc nào",
    plans: [
      { plan: "Miễn phí", period: "", cta: "Tải miễn phí", features: ["50 câu hỏi / tháng", "2 hồ sơ AI", "Lệnh cơ bản", "Lịch sử 7 ngày", "Windows"] },
      { plan: "Pro", period: "/tháng", cta: "Dùng thử Pro", badge: "Phổ biến nhất", features: ["Không giới hạn câu hỏi", "5 hồ sơ + tuỳ chỉnh", "Toàn bộ công cụ MCP", "Claude Sonnet & GPT-4o", "Lịch sử không giới hạn", "Hỗ trợ ưu tiên"] },
      { plan: "Nhóm", period: "/người/tháng", cta: "Liên hệ tư vấn", features: ["Mọi thứ trong gói Pro", "Hồ sơ dùng chung cho nhóm", "Bảng phân tích", "Quản trị + SSO", "Hỗ trợ riêng"] },
    ],
  },
  footerCta: {
    line1: "Đừng chuyển tab nữa.", line2: "Bắt tay vào việc.",
    sub: "Thấy gì đó? Hỏi AI ngay, ngay trên màn hình của bạn.",
    cta: "Tải SnapAha cho Windows · Miễn phí",
    fine: "Windows 10/11 · Không cần đăng ký",
  },
  footer: {
    tagline: "Thấy gì đó? Hỏi AI ngay.",
    links: ["Quyền riêng tư", "Điều khoản", "Hỗ trợ", "Blog", "Cập nhật"],
    admin: "Quản trị",
    rights: "© 2026 SnapAha. Bảo lưu mọi quyền.",
  },
};

const DICTS: Record<Lang, Dict> = { en, vi };

// Context
interface LangCtx { lang: Lang; setLang: (l: Lang) => void; t: Dict }
const LanguageContext = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Resolve real language on the client after mount (avoids hydration mismatch).
  useEffect(() => { setLangState(detectLang()); }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
    if (typeof document !== "undefined") document.documentElement.lang = l;
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: DICTS[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(): LangCtx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within <LanguageProvider>");
  return ctx;
}

// Convenience hook for components that only need the dictionary.
export function useT(): Dict {
  return useLang().t;
}
