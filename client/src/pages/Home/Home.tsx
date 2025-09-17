import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, Clock, Star, Heart, Dumbbell, MapPin } from "lucide-react";
import wallpaper from "../../assets/wallpaper.jpg";
import Model from "./Model";
import omar from "../../../public/trainer-1.jpg";
import lina from "../../../public/trainer-2.jpg";
import maya from "../../../public/trainer-0.jpeg";
import gym1 from "../../../public/gym1.jpeg";
import gym2 from "../../../public/gym-2.webp";
import gym3 from "../../../public/gym-3.jpg";
import equipment from "../../../public/gym-equipment-2.webp";

export const PROJECT_GRADIENT =
  "linear-gradient(90deg, rgba(91,33,182,1) 0%, rgba(124,58,237,1) 45%, rgba(167,139,250,1) 100%)";

type Stat = { label: string; value: string; icon?: React.ReactNode };

const TRAINERS = [
  {
    name: "Maya Haddad",
    title: "Strength & Conditioning",
    img: maya,
  },
  {
    name: "Omar Nassar",
    title: "Functional Trainer",
    img: omar,
  },
  {
    name: "Lina Azar",
    title: "Yoga & Mobility",
    img: lina,
  },
];

const SERVICES = [
  {
    title: "Personal Training",
    desc: "1-on-1 coaching programs customized to your goals.",
    icon: <Dumbbell size={18} />,
  },
  {
    title: "Group Classes",
    desc: "HIIT, Spin, Yoga, and more.",
    icon: <Users size={18} />,
  },
  {
    title: "Nutrition Coaching",
    desc: "Meal plans and habit coaching based on local foods.",
    icon: <Heart size={18} />,
  },
  {
    title: "Open Gym & Recovery",
    desc: "24/7 access, sauna, and mobility sessions.",
    icon: <Clock size={18} />,
  },
];

const STATS: Stat[] = [
  { label: "Members", value: "1,842+", icon: <Users size={20} /> },
  { label: "Years", value: "6", icon: <Star size={20} /> },
  { label: "Trainers", value: "12", icon: <Dumbbell size={20} /> },
  { label: "Branches", value: "2 (Beirut)", icon: <MapPin size={20} /> },
];

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: "easeOut" },
  }),
};

export default function Home(): React.ReactElement {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div
      className="w-full min-h-screen text-slate-900"
      style={{ background: "linear-gradient(180deg,#f6f0ff 0%, #fbe9ff 100%)" }}
    >
      {/* HERO */}
      <header className="relative overflow-hidden min-h-[420px] md:min-h-[520px]">
        {/* Layer 0: Background image (darker for contrast) */}
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
          <img
            src={wallpaper}
            alt=""
            className="w-full h-full object-cover object-center brightness-70"
          />
        </div>

        {/* Layer 1: Gradient tint (stronger to separate text from image) */}
        <div
          className="absolute inset-0 z-10"
          style={{ background: PROJECT_GRADIENT, opacity: 0.12 }}
          aria-hidden
        />

        {/* Layer 2: Content (above everything) */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1
                className="text-4xl md:text-5xl font-extrabold tracking-tight text-white"
                style={{ textShadow: "0 10px 30px rgba(15,7,32,0.45)" }}
              >
                Gym Name
              </h1>

              <p
                className="mt-4 text-white/90 max-w-xl"
                style={{ textShadow: "0 4px 16px rgba(15,7,32,0.35)" }}
              >
                Strength, mobility and community — a gym built with grit and
                good vibes. Programs scale to every level.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold shadow-lg transition transform"
                  style={{ background: PROJECT_GRADIENT, color: "white" }}
                  onClick={() => setModalOpen(true)}
                >
                  Join Today
                </button>

                {modalOpen && <Model onClose={() => setModalOpen(false)} />}
              </div>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STATS.map((s, i) => (
                  <motion.div
                    key={s.label}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-white/6 border border-white/8 shadow-sm"
                  >
                    <div className="flex items-center gap-2 text-pink-300">
                      {s.icon}
                      <span className="text-sm text-white/90">{s.label}</span>
                    </div>
                    <div className="font-bold text-lg text-white">
                      {s.value}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl bg-white border border-gray-100">
                <div className="p-6 md:p-8">
                  <h3 className="font-semibold text-xl text-slate-900">
                    What to Expect
                  </h3>
                  <p className="mt-3 text-slate-600">
                    Top-tier equipment, structured programs, and coaches who
                    care. All programs scale to your level — beginners welcome.
                  </p>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {SERVICES.map((s) => (
                      <div
                        key={s.title}
                        className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100"
                      >
                        <div className="p-2 rounded-md bg-white text-pink-600">
                          {s.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {s.title}
                          </div>
                          <div className="text-sm text-slate-600">{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <a
                      href="#programs"
                      className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition font-medium text-slate-900"
                    >
                      Explore Programs
                    </a>
                    <a
                      href="#trainers"
                      className="px-4 py-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition text-sm text-slate-900"
                    >
                      Meet Trainers
                    </a>
                  </div>
                </div>
                <div className="h-48 md:h-56 w-full overflow-hidden">
                  <img
                    src={equipment}
                    alt="gym equipment"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Trainers */}
        <section id="trainers" className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900">
            Meet our coaches
          </h2>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Our team blends science-backed training with motivation and care.
          </p>

          <div className="mt-6 overflow-x-auto py-2 -mx-6 px-6">
            <div className="flex gap-4 min-w-[780px] md:min-w-0">
              {TRAINERS.map((t, i) => (
                <motion.div
                  key={t.name}
                  custom={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12 }}
                  className="w-72 bg-white rounded-2xl p-4 flex-shrink-0 shadow-md border border-gray-100"
                >
                  <div className="w-full h-36 rounded-xl overflow-hidden">
                    <img
                      src={t.img}
                      alt={t.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-3">
                    <div className="font-semibold text-slate-900">{t.name}</div>
                    <div className="text-sm text-slate-600">{t.title}</div>
                    <div className="mt-3 text-sm text-slate-600">
                      Available for coaching and small-group classes.
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials & Gallery */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <motion.div
            className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-inner border border-gray-100"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-bold text-xl text-slate-900">
              What members say
            </h3>
            <div className="mt-4 space-y-4">
              <blockquote className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-slate-800">
                  "Forge changed how I think about fitness — the coaches are
                  patient, and the programs actually work." — Samir
                </p>
              </blockquote>
              <blockquote className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-slate-800">
                  "Great equipment and community. I stayed consistent for the
                  first time in years." — Rania
                </p>
              </blockquote>
            </div>
          </motion.div>

          <motion.div
            className="bg-white p-3 rounded-2xl shadow-md border border-gray-100"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h4 className="font-semibold text-slate-900">Gallery</h4>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <img
                className="w-full h-20 object-cover rounded"
                src={gym1}
                alt="gallery-1"
              />
              <img
                className="w-full h-20 object-cover rounded"
                src={gym2}
                alt="gallery-2"
              />
              <img
                className="w-full h-20 object-cover rounded"
                src={gym3}
                alt="gallery-3"
              />
            </div>
          </motion.div>
        </section>

        {/* Memberships washere */}

        {/* FAQ / Contact */}
        <section
          id="contact"
          className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
        >
          <div>
            <h3 className="font-bold text-xl text-slate-900">
              Frequently asked
            </h3>
            <div className="mt-4 space-y-3">
              <details className="bg-white p-4 rounded-xl border border-gray-100">
                <summary className="font-medium text-slate-900">
                  Do you offer trial sessions?
                </summary>
                <p className="mt-2 text-slate-600">
                  Yes — one-week trial passes available.
                </p>
              </details>
              <details className="bg-white p-4 rounded-xl border border-gray-100">
                <summary className="font-medium text-slate-900">
                  Are beginners welcome?
                </summary>
                <p className="mt-2 text-slate-600">
                  Absolutely — programs are scaled to all fitness levels.
                </p>
              </details>
              <details className="bg-white p-4 rounded-xl border border-gray-100">
                <summary className="font-medium text-slate-900">
                  Where are you located?
                </summary>
                <p className="mt-2 text-slate-600">
                  Main branch: Hamra, Beirut. Second branch: Achrafieh.
                </p>
              </details>
            </div>
          </div>
        </section>

        <footer className="py-8 text-center text-slate-600">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Star size={18} />
              <span className="font-semibold"> Gym Name</span>
            </div>
            <div>
              © {new Date().getFullYear()} Gym Name — Built with ❤️ in Beirut
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
