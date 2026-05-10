import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle, Sparkles, ArrowRight, Heart } from "lucide-react";
import { useI18n } from "../i18n";

interface LifeQuizModalProps {
  onPass: () => void;
  onClose: () => void;
  visible: boolean;
}

const QUESTIONS_ZH = [
  {
    question: "我不会下面哪项技能？",
    options: ["UI/UX 界面设计", "动画与动效制作", "AIGC 视觉生成与网站落地", "开挖掘机修高速公路"],
    correct: 3,
    emoji: "🤔",
    hint: "正确答案是一个一眼就很离谱的选项",
  },
  {
    question: "下面哪组更贴近我的综合能力方向？",
    options: ["UI 设计 + 动画表达 + AIGC + Vibe Coding", "纯财务审计 + 税务申报 + 合规核账", "纯机械装配 + 车床加工 + 焊接工艺", "纯临床护理 + 手术配台 + 病历管理"],
    correct: 0,
    emoji: "🧩",
    hint: "我擅长的是设计、动画与 AI 结合的跨领域能力",
  },
  {
    question: "以下哪项是我能服务的不同行业场景？",
    options: ["互联网产品页面设计", "品牌与活动视觉包装", "文化传播类动画与短视频", "以上都可以覆盖"],
    correct: 3,
    emoji: "🚀",
    hint: "我的能力可以跨行业复用，不局限单一赛道",
  },
];

const QUESTIONS_EN = [
  {
    question: "Which skill do I NOT have?",
    options: ["UI/UX interface design", "Animation and motion design", "AIGC visual generation and web implementation", "Driving an excavator to build highways"],
    correct: 3,
    emoji: "🤔",
    hint: "The correct one is intentionally absurd",
  },
  {
    question: "Which combo best matches my core capability stack?",
    options: ["UI design + animation storytelling + AIGC + vibe coding", "Financial audit + tax filing + compliance accounting", "Mechanical assembly + lathe machining + welding", "Clinical nursing + operating room assistance + records management"],
    correct: 0,
    emoji: "🧩",
    hint: "My focus is design, motion, and AI-enabled production",
  },
  {
    question: "Which cross-industry scenarios can I support?",
    options: ["Internet product interface design", "Brand and campaign visual assets", "Cultural storytelling animation/video", "All of the above"],
    correct: 3,
    emoji: "🚀",
    hint: "My skills are transferable across multiple industries",
  },
];

type AnswerState = "idle" | "correct" | "wrong";

const LifeQuizModal = ({ onPass = () => {}, onClose = () => {}, visible = false }: LifeQuizModalProps) => {
  const { lang } = useI18n();
  const QUESTIONS = lang === "en" ? QUESTIONS_EN : QUESTIONS_ZH;
  const [step, setStep] = useState(0); // 0=intro, 1..3=questions, 4=success
  const [selected, setSelected] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [correctCount, setCorrectCount] = useState(0);
  const [shake, setShake] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [confetti] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      color: i % 4 === 0 ? "var(--primary)" : i % 4 === 1 ? "var(--accent)" : i % 4 === 2 ? "#ff6b9d" : "#00d4aa",
      size: 4 + Math.random() * 6,
    }))
  );

  useEffect(() => {
    if (visible) {
      setTimeout(() => setAnimIn(true), 80);
    } else {
      setAnimIn(false);
      setStep(0);
      setSelected(null);
      setAnswerState("idle");
      setCorrectCount(0);
    }
  }, [visible]);

  const playTone = (freq: number, duration = 0.2) => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log("Audio error", e);
    }
  };

  const handleSelect = (optIdx: number) => {
    if (answerState !== "idle") return;
    setSelected(optIdx);
    const qIndex = step - 1;
    const isCorrect = optIdx === QUESTIONS[qIndex].correct;

    if (isCorrect) {
      setAnswerState("correct");
      setCorrectCount((c) => c + 1);
      playTone(660, 0.3);
      setTimeout(() => playTone(880, 0.2), 150);
    } else {
      setAnswerState("wrong");
      setShake(true);
      playTone(220, 0.4);
      setTimeout(() => setShake(false), 600);
    }

    setTimeout(() => {
      if (step < QUESTIONS.length) {
        setStep((s) => s + 1);
        setSelected(null);
        setAnswerState("idle");
      } else {
        // Final result
        setStep(4);
        if (isCorrect ? correctCount + 1 >= 2 : correctCount >= 2) {
          setCelebrate(true);
          playTone(523, 0.15);
          setTimeout(() => playTone(659, 0.15), 150);
          setTimeout(() => playTone(784, 0.25), 300);
        }
      }
    }, 1200);
  };

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      onClose();
      setExiting(false);
    }, 400);
  };

  const handleEnter = () => {
    setExiting(true);
    setTimeout(() => {
      onPass();
    }, 400);
  };

  if (!visible) return null;

  const qIndex = step - 1;
  const currentQ = step >= 1 && step <= QUESTIONS.length ? QUESTIONS[qIndex] : null;
  const finalCorrect = answerState === "correct" && step === QUESTIONS.length + 1 - 1 ? correctCount + 1 : step === 4 ? correctCount : 0;
  const passed = step === 4 && correctCount >= 2;

  return (
    <div
      className="fixed inset-0 z-[8500] flex items-center justify-center p-6"
      style={{
        background: "rgba(10,10,15,0.88)",
        backdropFilter: "blur(16px)",
        opacity: exiting ? 0 : animIn ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    >
      {/* Confetti on success */}
      {celebrate && confetti.map((c) => (
        <div
          key={c.id}
          className="absolute top-0 rounded-sm pointer-events-none"
          style={{
            left: `${c.x}%`,
            width: c.size,
            height: c.size * 1.5,
            background: c.color,
            animation: `confettiFall 2s ease-in forwards`,
            animationDelay: `${c.delay}s`,
            opacity: 0,
          }}
        />
      ))}

      <div
        className="relative w-full max-w-lg rounded-3xl border overflow-hidden"
        style={{
          background: "var(--card)",
          borderColor: "rgba(168,85,247,0.25)",
          boxShadow: "0 0 60px rgba(168,85,247,0.15), 0 40px 80px rgba(0,0,0,0.5)",
          transform: exiting ? "scale(0.92) translateY(16px)" : animIn ? "scale(1) translateY(0)" : "scale(0.88) translateY(24px)",
          transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Progress bar */}
        {step >= 1 && step <= QUESTIONS.length && (
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "var(--border)" }}>
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${(step / QUESTIONS.length) * 100}%`,
                background: "linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)",
              }}
            />
          </div>
        )}

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-primary hover:text-primary-foreground z-10"
          style={{ background: "var(--surface-2)", color: "var(--muted-foreground)" }}
        >
          <X size={14} />
        </button>

        <div className="p-10">
          {/* Intro step */}
          {step === 0 && (
            <div className="text-center">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, var(--primary) 0%, #c084fc 50%, var(--accent) 100%)" }}
              >
                <span>🔒</span>
                <div
                  className="absolute inset-0 opacity-30"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)" }}
                />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-3">{lang === "en" ? "Unlock Life" : "解锁个人生活"}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                {lang === "en" ? (
                  <>
                    Before seeing my personal moments, let’s do a quick quiz 😉
                    <br />
                    Answer <span className="text-primary font-semibold">2/3</span> to unlock.
                  </>
                ) : (
                  <>
                    嘿！在看我的私人生活之前，先来个小测试吧 😉<br />
                    看看你对我了解多少？答对 <span className="text-primary font-semibold">2/3</span> 题即可解锁~
                  </>
                )}
              </p>
              <div className="flex gap-3 mb-6">
                {QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-2 rounded-full"
                    style={{ background: "var(--border)" }}
                  />
                ))}
              </div>
              <button
                onClick={() => { setStep(1); playTone(440, 0.1); }}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 hover:shadow-glow relative overflow-hidden group"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)" }}
                />
                <Sparkles size={16} />
                {lang === "en" ? "Start!" : "开始答题！"}
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Question steps */}
          {currentQ && step >= 1 && step <= QUESTIONS.length && (
            <div className={shake ? "quiz-shake" : ""}>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs text-primary font-medium tracking-widest uppercase">
                  {lang === "en" ? `Q ${step} / ${QUESTIONS.length}` : `问题 ${step} / ${QUESTIONS.length}`}
                </span>
                <span className="text-2xl">{currentQ.emoji}</span>
              </div>

              <h3 className="text-xl font-bold text-foreground leading-snug mb-2">{currentQ.question}</h3>
              <p className="text-xs text-muted-foreground mb-8">
                {lang === "en" ? `💡 Hint: ${currentQ.hint}` : `💡 提示：${currentQ.hint}`}
              </p>

              <div className="flex flex-col gap-3">
                {currentQ.options.map((opt, idx) => {
                  let bg = "var(--surface-1)";
                  let border = "var(--border)";
                  let textColor = "var(--foreground)";

                  if (answerState !== "idle" && selected === idx) {
                    if (answerState === "correct") {
                      bg = "rgba(0,212,170,0.12)";
                      border = "#00d4aa";
                      textColor = "#00d4aa";
                    } else {
                      bg = "rgba(255,68,68,0.12)";
                      border = "var(--destructive)";
                      textColor = "var(--destructive)";
                    }
                  } else if (answerState === "wrong" && idx === currentQ.correct) {
                    bg = "rgba(0,212,170,0.08)";
                    border = "rgba(0,212,170,0.4)";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      disabled={answerState !== "idle"}
                      className="flex items-center gap-4 w-full text-left px-5 py-4 rounded-xl border transition-all duration-300 hover:border-primary hover:scale-[1.02] disabled:cursor-default disabled:hover:scale-100"
                      style={{ background: bg, borderColor: border, color: textColor }}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300"
                        style={{
                          background: selected === idx && answerState !== "idle"
                            ? (answerState === "correct" ? "#00d4aa20" : "rgba(255,68,68,0.2)")
                            : "var(--surface-2)",
                          color: selected === idx && answerState !== "idle"
                            ? (answerState === "correct" ? "#00d4aa" : "var(--destructive)")
                            : "var(--muted-foreground)",
                        }}
                      >
                        {answerState !== "idle" && selected === idx
                          ? (answerState === "correct" ? "✓" : "✗")
                          : String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm font-medium">{opt}</span>
                      {answerState !== "idle" && selected === idx && answerState === "correct" && (
                        <CheckCircle size={16} className="ml-auto flex-shrink-0" style={{ color: "#00d4aa" }} />
                      )}
                      {answerState !== "idle" && selected === idx && answerState === "wrong" && (
                        <XCircle size={16} className="ml-auto flex-shrink-0" style={{ color: "var(--destructive)" }} />
                      )}
                      {answerState === "wrong" && idx === currentQ.correct && (
                        <CheckCircle size={16} className="ml-auto flex-shrink-0" style={{ color: "#00d4aa" }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {answerState !== "idle" && (
                <div
                  className="mt-5 px-5 py-3 rounded-xl text-sm font-medium"
                  style={{
                    background: answerState === "correct" ? "rgba(0,212,170,0.1)" : "rgba(255,68,68,0.1)",
                    color: answerState === "correct" ? "#00d4aa" : "var(--destructive)",
                    border: `1px solid ${answerState === "correct" ? "rgba(0,212,170,0.3)" : "rgba(255,68,68,0.3)"}`,
                  }}
                >
                  {answerState === "correct"
                    ? lang === "en"
                      ? "🎉 Correct! Nice!"
                      : "🎉 回答正确！真棒～"
                    : lang === "en"
                      ? "😅 Not quite, but no worries!"
                      : "😅 哎呀，答错了！但没关系～"}
                </div>
              )}
            </div>
          )}

          {/* Result step */}
          {step === 4 && (
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">
                {passed ? "🎉" : "😅"}
              </div>
              <h3 className="text-2xl font-black text-foreground mb-2">
                {passed ? (lang === "en" ? "Unlocked!" : "恭喜通过！") : lang === "en" ? "Try again" : "再来一次吧～"}
              </h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-4xl font-black text-gradient">{correctCount}</span>
                <span className="text-xl text-muted-foreground">/ {QUESTIONS.length}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                {passed
                  ? lang === "en"
                    ? "You know me well—welcome in 💫"
                    : "你真的很了解我！欢迎进入我的个人生活空间 💫"
                  : lang === "en"
                    ? "So close—give it another shot!"
                    : "还差一点点，不过没关系，你仍然可以看看我的日常～"}
              </p>

              <div className="flex gap-3">
                {!passed && (
                  <button
                    onClick={() => {
                      setStep(0);
                      setCorrectCount(0);
                      setSelected(null);
                      setAnswerState("idle");
                      setCelebrate(false);
                    }}
                    className="flex-1 py-3.5 rounded-2xl border text-sm font-medium transition-all duration-300 hover:border-primary"
                    style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                  >
                    {lang === "en" ? "Retry" : "重新挑战"}
                  </button>
                )}
                <button
                  onClick={handleEnter}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 hover:shadow-glow"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  <Heart size={14} />
                  {lang === "en" ? "Enter" : "进入生活空间"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .quiz-shake {
          animation: quizShake 0.5s ease;
        }
        @keyframes quizShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};

export default LifeQuizModal;
