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
    line1: "Stop switching.", line2: "Start doing.",
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

// Vietnamese (natural phrasing, "Aha" anchored as the brand emotional hook)
const vi: Dict = {
  nav: { features: "Tính năng", how: "Cách dùng", useCases: "Ứng dụng", pricing: "Bảng giá", download: "Tải miễn phí" },
  hero: {
    badge: (q) => `Beta công khai · đã giải đáp ${q} câu hỏi`,
    free: "MIỄN PHÍ",
    line1: "Đang bí?",
    line2: "Aha! Sáng ngay.",
    sub: "Đoạn văn khó nhằn. Từ lạ không biết nghĩa. Email chẳng biết reply thế nào. Chỉ cần bôi đen, hiểu ngay trong một giây, ngay chỗ đang làm. Không đổi tab. Không copy-paste. Không đứt mạch.",
    cta: "Tải về Windows · Miễn phí",
    secondary: "Thử ngay tại đây",
    trust: "Windows 10/11 · Không cần đăng ký · Không cần thẻ",
    rating: "4.8 / 5",
    usersLove: "hơn 12.000 người đang dùng mỗi ngày",
    flow: ["Nhìn thấy", "Chớp lấy", "Aha!"],
  },
  demo: {
    eyebrow: "Tự tay thử ngay tại đây",
    head: `Khoảnh khắc "Aha!" trước khi tải về`,
    sub: "Đây chính xác là cảm giác khi dùng SnapAha. Bôi đen chỗ không hiểu, xem nó sáng tỏ ngay trong một giây.",
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
    tryHint: "Chọn thao tác, AI trả lời ngay tức thì",
    replay: "Xem lại",
    ahaShort: "Ty thể = nhà máy năng lượng của tế bào",
    actions: [
      { label: "Giải thích dễ hiểu", answer: "Nói thật đơn giản: ty thể là những “cục pin” tí hon trong tế bào. Chúng biến đồ ăn bạn nạp vào thành ATP, nguồn năng lượng vận hành mọi thứ trong cơ thể." },
      { label: "Tạo flashcard", answer: "Hỏi: Ty thể sản xuất ra gì?\nĐáp: ATP, nhiên liệu của tế bào.\n\nHỏi: Biệt danh nổi tiếng của nó?\nĐáp: “Nhà máy điện của tế bào.”" },
      { label: "Dịch sang tiếng Việt", answer: "Ty thể là “nhà máy điện” của tế bào, tạo ra phần lớn ATP, nguồn năng lượng hoá học cho hô hấp tế bào và toàn bộ quá trình trao đổi chất." },
    ],
  },
  beta: {
    badge: "TRUY CẬP SỚM · BETA",
    joined: (n) => `${n} người đã vào trước`,
    closesIn: { a: "Beta đóng cửa", b: "sau" },
    freeLimited: { a: "Miễn phí,", b: "có thời hạn." },
    perks: [
      "Miễn phí 100% trong suốt giai đoạn beta",
      "Huy hiệu người dùng tiên phong tại v1.0",
      "Không giới hạn câu hỏi & toàn bộ tính năng",
      "Trực tiếp định hình sản phẩm cùng đội ngũ",
    ],
    cta: "Tải về Windows · Miễn phí",
    fine: "Windows 10/11 · Không cần đăng ký · Không cần thẻ",
    days: "Ngày", hours: "Giờ", mins: "Phút", secs: "Giây",
  },
  problem: {
    eyebrow: "Quen cảnh này chưa?",
    headPre: "Mỗi năm bạn mất", headPost: "chỉ để đi tra cứu", daysUnit: " ngày",
    sub: { a: "Vài chục lần khựng lại mỗi ngày × 60 giây × 250 ngày làm việc = ", bold: "hơn 200 giờ bay đi", b: ". Chưa tính thời gian tìm lại chỗ cũ và kéo sự tập trung trở về." },
    without: "Cách cũ", withApp: "Với SnapAha",
    withoutSteps: [
      "Đang đọc hoặc viết dở, buộc phải dừng",
      "Mở thêm một tab mới",
      "Vào Google Dịch hoặc ChatGPT",
      "Gõ lại hoặc dán nội dung vào",
      "Chờ kết quả, đọc, rồi tự ghép lại",
      "Quay về tìm lại chỗ vừa bỏ dở",
    ],
    withSteps: [
      "Bôi đen chỗ đang bí",
      "Nhấn Ctrl+Shift+Space",
      "Aha! Đọc xong, làm tiếp thôi",
    ],
    withoutTime: "30–90 giây · mất hết mạch suy nghĩ", withTime: "Dưới 5 giây · không rời khỏi trang",
  },
  how: {
    eyebrow: "3 bước · dưới 5 giây",
    head: "AI tức thì. Không một giây gián đoạn.",
    steps: [
      { title: "Nhấn phím tắt", desc: "Ctrl+Shift+Space từ bất kỳ ứng dụng nào: IDE, trình duyệt, PDF, terminal, thậm chí game." },
      { title: "Khoanh vùng tuỳ ý", desc: "Kéo chọn đoạn văn, đoạn mã, hình ảnh hay video. Mọi điểm ảnh trên màn hình đều được." },
      { title: "Nhận câu trả lời tức thì", desc: "AI đọc bằng OCR + Vision và trả kết quả ngay trong cửa sổ nổi ngay cạnh bạn, không cần rời tay." },
    ],
  },
  features: {
    eyebrow: "Tính năng",
    head1: "Mọi thứ bạn cần để AI", head2: "không bao giờ chậm hơn bạn",
    items: [
      { badge: "Cốt lõi", title: "Chụp màn hình → có ngay câu trả lời", desc: "Đọc được mọi PDF, slide, video hoặc app đang khoá. Thấy là hỏi được." },
      { badge: "5 hồ sơ", title: "Mỗi vai bạn, một trợ lý riêng", desc: "Study Buddy, Office Pro, Language Coach. Chuyển đổi bằng một cú nhấp." },
      { title: "QuickChat, luôn ở đó khi cần", desc: "Khung chat mini luôn nổi trên màn hình. Gõ, thả ảnh, hỏi bất cứ lúc nào." },
      { title: "Mọi câu hỏi đều được lưu lại", desc: "Toàn bộ hỏi & đáp được lưu và tìm kiếm được, như nhật ký học tập của bạn." },
      { title: "Tự học theo thói quen của bạn", desc: "Thao tác hay dùng nhất tự nổi lên đầu danh sách. Luôn cách bạn đúng một cú nhấp." },
      { badge: "Nâng cao", title: "Kết nối với mọi công cụ bạn dùng", desc: "Không chỉ trả lời, còn tìm kiếm web và đọc file thay bạn." },
    ],
  },
  useCases: {
    eyebrow: "Cho mọi công việc",
    head1: "Sinh ra để khớp với cách", head2: "bạn vẫn làm việc thật sự",
    quickActions: "Thao tác nhanh",
    cases: [
      { label: "Sinh viên", highlight: "Học nhanh gấp 3, bớt nản gấp 10", story: `Một đoạn cứ đọc mãi không vào đầu. Bôi đen, bấm "Giải thích dễ hiểu". Vài giây sau là thông suốt. Rồi biến ngay thành flashcard ôn thi.`, actions: ["Giải thích dễ hiểu", "Tạo flashcard", "Dịch", "Kiểm tra tôi"] },
      { label: "Văn phòng", highlight: "Trông chuyên nghiệp chỉ trong 15 giây", story: `Email tiếng Anh trang trọng vừa đến. Bôi đen, bấm "Soạn phản hồi". Bản trả lời chỉn chu, đúng tông, sẵn sàng gửi. Ra dáng người làm việc chuyên nghiệp.`, actions: ["Soạn phản hồi", "Dịch", "Tóm tắt báo cáo", "Chỉnh giọng văn"] },
      { label: "Sáng tạo", highlight: "Lấy cảm hứng, vẫn đúng chất mình", story: `Thấy một câu của người khác hay đến nỗi muốn "mượn". Bôi đen, bấm "Viết lại theo giọng của tôi". Giờ nó là của bạn rồi. Lấy cảm hứng, không sao chép.`, actions: ["Viết lại", "Chỉnh giọng văn", "Gợi ý tiêu đề", "Soát ngữ pháp"] },
      { label: "Lập trình viên", highlight: "Ừ thì code nó cũng làm được", story: `Cả terminal đỏ lỗi, không biết bắt đầu từ đâu. Bôi đen thông báo lỗi, bấm "Giải thích lỗi". Nguyên nhân gốc và cách sửa ngay tại chỗ. Không cần mở Stack Overflow.`, actions: ["Giải thích lỗi", "Sửa code", "Tra tài liệu", "Soát PR"] },
    ],
  },
  social: {
    stats: [{ label: "Người dùng beta" }, { label: "Câu hỏi đã giải đáp" }, { label: "Điểm đánh giá ứng dụng" }, { label: "Tỉ lệ dùng lại ngày 7" }],
    testimonials: [
      { q: "Tôi dùng SnapAha 40–50 lần mỗi ngày. Như có thêm một cái não luôn tỉnh táo, không bao giờ làm đứt mạch làm việc của tôi.", a: "Minh T.", r: "Senior Backend Engineer" },
      { q: "Nghiên cứu sinh đọc 10 bài báo mỗi ngày. Tóm tắt + Flashcard cắt giảm 40% thời gian đọc. Tính năng đổi hồ sơ thực sự là một bước ngoặt.", a: "Thu N.", r: "Nghiên cứu sinh Tiến sĩ, CNTT" },
      { q: "Hồ sơ Office Pro viết email còn khéo léo hơn tôi. Lịch sự, dứt khoát, chuyên nghiệp. Email nào khó tôi đều nhờ nó xử lý.", a: "Lan P.", r: "Quản lý Dự án" },
    ],
  },
  pricing: {
    eyebrow: "Bảng giá",
    head: "Bắt đầu miễn phí. Nâng cấp khi thấy cần.",
    sub: "Không cần thẻ tín dụng · Huỷ bất cứ lúc nào",
    plans: [
      { plan: "Miễn phí", period: "", cta: "Tải miễn phí", features: ["50 câu hỏi / tháng", "2 hồ sơ AI", "Lệnh cơ bản", "Lịch sử 7 ngày", "Windows"] },
      { plan: "Pro", period: "/tháng", cta: "Dùng thử Pro", badge: "Phổ biến nhất", features: ["Không giới hạn câu hỏi", "5 hồ sơ + tuỳ chỉnh", "Toàn bộ công cụ MCP", "Claude Sonnet & GPT-4o", "Lịch sử không giới hạn", "Hỗ trợ ưu tiên"] },
      { plan: "Nhóm", period: "/người/tháng", cta: "Liên hệ tư vấn", features: ["Tất cả tính năng Pro", "Hồ sơ dùng chung cho nhóm", "Bảng phân tích dữ liệu", "Quản trị + SSO", "Hỗ trợ chuyên biệt"] },
    ],
  },
  footerCta: {
    line1: "Dừng mở tab.", line2: "Aha! Giúp bạn.",
    sub: "Thấy gì không hiểu? Hỏi AI ngay, ngay trên màn hình bạn đang dùng.",
    cta: "Tải SnapAha cho Windows · Miễn phí",
    fine: "Windows 10/11 · Không cần đăng ký",
  },
  footer: {
    tagline: "Thấy là hiểu. Ngay tại chỗ.",
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
