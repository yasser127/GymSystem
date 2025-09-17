import React from "react";
import { Star, Users, Dumbbell } from "lucide-react";
import wallpaper from "../../assets/wallpaper.jpg";

const PROJECT_GRADIENT =
  "linear-gradient(90deg, rgba(91,33,182,1) 0%, rgba(124,58,237,1) 45%, rgba(167,139,250,1) 100%)";

export default function AboutGymPage(): React.ReactElement {
  return (
    <div
      className="w-full min-h-screen text-slate-900"
      style={{ background: "linear-gradient(180deg,#f6f0ff 0%, #fbe9ff 100%)" }}
    >
      <header className="relative min-h-[320px] pt-50 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={wallpaper}
            alt=""
            className="w-full h-full object-cover object-center brightness-75"
            // cropp
            style={{ objectPosition: "center -200px" }}
          />
        </div>

        <div
          className="absolute inset-0 z-10"
          style={{ background: PROJECT_GRADIENT, opacity: 0.12 }}
          aria-hidden
        />

        <div className="relative z-20 max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">
            About Gym Name
          </h1>
          <p className="mt-3 text-white/90 max-w-2xl mx-auto">
            A straightforward studio built on practical coaching, friendly
            members, and programs that help you make real progress.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900">Our mission</h2>
          <p className="text-slate-600 mt-2">
            Make coaching accessible and sustainable — simple plans, consistent
            progress, and a welcoming space for everyone.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900">Core values</h3>
          <ul className="mt-3 space-y-3 text-slate-600">
            <li className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ background: PROJECT_GRADIENT, color: "white" }}
              >
                <Star size={16} />
              </div>
              <div>
                <div className="font-medium">Quality coaching</div>
                <div className="text-sm">
                  Clear instruction, measurable progress.
                </div>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ background: PROJECT_GRADIENT, color: "white" }}
              >
                <Users size={16} />
              </div>
              <div>
                <div className="font-medium">Community</div>
                <div className="text-sm">
                  Friendly members who support each other.
                </div>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ background: PROJECT_GRADIENT, color: "white" }}
              >
                <Dumbbell size={16} />
              </div>
              <div>
                <div className="font-medium">Sustainability</div>
                <div className="text-sm">
                  Programs that fit life and scale over time.
                </div>
              </div>
            </li>
          </ul>
        </section>

        <section className="text-center">
          <a
            href="/plans"
            className="inline-flex px-5 py-2 rounded-2xl font-semibold"
            style={{ background: PROJECT_GRADIENT, color: "white" }}
          >
            Start a trial
          </a>
        </section>

        <footer className="mt-12 py-6 text-center text-slate-600">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Star size={16} />
            <span className="font-semibold"> Gym Name</span>
          </div>
          <div>
            © {new Date().getFullYear()}  Gym Name — Built with ❤️ in Beirut
          </div>
        </footer>
      </main>
    </div>
  );
}
