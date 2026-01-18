import { HeaderNav } from "./components/HeaderNav";

export default function Home() {
  const heroBefore =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAXwZxhaLsf9uWa51XXlLPSrUKnp1GECxXAqUYkyWjr8fEXt16axHjs0j3GQGfU3ksHrQNc1v4nPiqMOYpcQcKlSHGaUXIN2CpJW99Zq0lXe7kbgF9g3HZLFqpDcmNzC_zrKSCs1sVqPAq62xsNt2oEq8OLj4I5n_QSN4U6GJjS71IaQgH-z_H1EV8DcQnQwrrthk9TI_vFyE0CAly6eqOOI9fIdlVLr68Y72RfBws99QVhsa-l_ejmMGa2tZj-1-7jdu5nqtacxx3Q";
  const heroAfter =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAPhLLSh_fkbBcTgVHDqE0CV3XjjkIxWE3aiWU2G4WRj0nN0hwm2ZPPfqfPutFAJC8pEZ6kuFCwFBs2QqowLhZ3cflEVfq1pSE0VISxGl7EZwDvcLrGeMNLwUMmvTVKGnIUyLutR366dOlq1ul8to0oNXiRiOM1f7riPzyFVGVBAm3u7qEXbxJjtDnmtdQ9J3LC25Ywi_78IImiNp-Mfuq0ZjPGKXFLzTuS2pklY7MYojJ8blyepciqGzK85kt8htNkojLguuDRPuaN";
  const cardImage =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBdq7Z-4UWr7OM4AhqbOf3LQdJthdvfINIK6EyDvnTbQAd8RxkQ92Ufm7eIqkYBeICX1Xzu0vPm6Jg0KMy8qYUG2MW6030OtqpyWU4SnfbduwmUqU3CvbCT6CgTQYbVS9UAj4ry3xEDUMcObDgjYCGo1zitxfsna6BTy55p04psF-FWrBwMiyDTdubJ02Dk5vUxEMVxb3EQh8Dj_oxhyYZJSbEp4iSh7m6EuWqcrerLpxHO9e3WwDPyY-rwlsZN-4nR0BEYxGbLONsO";

  return (
    <div className="bg-white text-[#121716]">
      <div className="sticky top-0 z-50 w-full border-b border-[#f1f4f3] bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-[1280px] px-6 py-4">
          <HeaderNav />
        </div>
      </div>

      <header className="relative w-full overflow-hidden pb-20 pt-12 lg:pb-32 lg:pt-24">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="z-10 flex flex-col gap-8 text-center lg:text-left">
              <div className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-[#16695b]/20 bg-[#e3ebe9] px-3 py-1 lg:mx-0">
                <span className="material-symbols-outlined text-[18px] text-[#16695b]">📍</span>
                <span className="text-xs font-bold uppercase tracking-wide text-[#16695b]">A Vegan Journey</span>
              </div>
              <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-[#121716] lg:text-[4rem]">
                Love your food.
                <br />
                <span className="bg-gradient-to-br from-[#16695b] to-[#2d8a78] bg-clip-text text-transparent">Swap the rest.</span>
              </h1>
              <p className="mx-auto max-w-xl text-lg leading-relaxed text-[#66857f] lg:mx-0 lg:text-xl">
                The easiest way to eat plant-based anywhere without giving up the flavors you love. Start your journey
                with just one meal.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <button className="flex h-14 items-center justify-center rounded-xl bg-[#16695b] px-8 text-base font-bold text-white shadow-[0_20px_40px_-10px_rgba(22,105,91,0.18)] transition-all hover:-translate-y-1 hover:bg-[#104f44] hover:shadow-lg">
                  Find my swap
                </button>
                <button className="flex h-14 items-center justify-center rounded-xl border border-[#dce4e3] bg-white px-8 text-base font-medium text-[#121716] transition-all hover:bg-gray-50 hover:border-[#16695b]/50">
                  View Menu
                </button>
              </div>
              <div className="flex items-center justify-center gap-4 pt-4 lg:justify-start">
                <div className="-space-x-3 flex">
                  {[1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="h-10 w-10 rounded-full border-2 border-white bg-gray-200 bg-cover"
                      style={{
                        backgroundImage:
                          "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD4Ja1DvdOFVFLZ9rdxG2j2EZXijc-G_ZOBNczPX56_TWHDoCMujw5BCp3IjGNeuhpwEgCZuXpnTHeLLYYIjBP65R-2jvAQUNl1ASOSTmBfke59lNULb5KGfqEfj7zKDLMuOPyQWEkxrxoEsQEROPx_iF3EazS8aCHkV3m7toC4H2kWGgzgrhjKDBE8D64kijXYR2c8rIoDYwjFrTo8jlmLlLWNyHQ4o58TPjAf37zCUXH6FtgCgbtxVWH12WuTsOzu1-YjaTSOIuug')",
                      }}
                    />
                  ))}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#16695b] text-xs font-bold text-white">
                    +2k
                  </div>
                </div>
                <p className="text-sm font-medium text-[#66857f]">Joined this week</p>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:order-2 lg:max-w-full">
              <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-yellow-400/20 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-72 w-72 rounded-full bg-[#16695b]/20 blur-3xl" />
              <div className="relative rotate-2 border border-gray-100 bg-white p-6 shadow-2xl transition-transform duration-500 ease-out hover:rotate-0 lg:rotate-3">
                <div className="group relative h-48 overflow-hidden rounded-xl">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 z-20">
                    <span className="mb-1 inline-block rounded bg-red-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700">
                      Before
                    </span>
                    <h3 className="text-lg font-bold text-white">Butter Chicken</h3>
                  </div>
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${heroBefore})` }}
                  />
                </div>

                <div className="-my-6 flex h-12 items-center justify-center">
                  <div className="rounded-full border border-gray-100 bg-white p-2 shadow-lg">
                    <span className="material-symbols-outlined animate-pulse text-[#16695b]">swap_vert</span>
                  </div>
                </div>

                <div className="group relative h-48 overflow-hidden rounded-xl">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 z-20">
                    <span className="mb-1 inline-block rounded bg-green-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-green-700">
                      After
                    </span>
                    <h3 className="text-lg font-bold text-white">Tofu Makhani</h3>
                  </div>
                  <div className="absolute right-4 top-3 z-20 flex gap-2">
                    <div className="flex flex-col items-center justify-center rounded-lg border border-white/30 bg-white/20 p-1.5 text-white backdrop-blur-md">
                      <span className="material-symbols-outlined text-[16px]">water_drop</span>
                      <span className="text-[10px] font-bold">900L</span>
                    </div>
                  </div>
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${heroAfter})` }}
                  />
                </div>
                <div className="pt-4 text-sm text-[#66857f]">
                  <div className="flex items-center justify-between">
                    <span>Same rich taste.</span>
                    <span className="font-bold text-[#16695b]">Zero cholesterol.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="impact" className="border-y border-[#eff2f1] bg-[#f8fafc] py-10">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="flex flex-wrap justify-center gap-8 text-center md:gap-20">
            <div className="flex flex-col items-center">
              <span className="mb-1 text-3xl font-black text-[#121716] lg:text-4xl">10k+</span>
              <span className="text-sm font-medium text-[#66857f]">Conscious Eaters</span>
            </div>
            <div className="hidden h-16 w-px bg-gray-200 md:block" />
            <div className="flex flex-col items-center">
              <div className="mb-1 flex items-center gap-1">
                <span className="text-3xl font-black text-[#121716] lg:text-4xl">4.8</span>
                <span className="material-symbols-outlined text-3xl text-yellow-400">star</span>
              </div>
              <span className="text-sm font-medium text-[#66857f]">Average Rating</span>
            </div>
            <div className="hidden h-16 w-px bg-gray-200 md:block" />
            <div className="flex flex-col items-center">
              <span className="mb-1 text-3xl font-black text-[#121716] lg:text-4xl">50+</span>
              <span className="text-sm font-medium text-[#66857f]">Restaurant Partners</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#121716] lg:text-4xl">How it works</h2>
            <p className="text-lg text-[#66857f]">Three simple steps to make a difference without compromising on the taste you crave.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: "search",
                title: "Search",
                copy: "Find your favorite local dishes instantly. From Biryani to Vada Pav, we've got the map.",
              },
              {
                icon: "published_with_changes",
                title: "Swap",
                copy: "See the best plant-based alternative nearby. Order directly or get the recipe.",
              },
              {
                icon: "deceased",
                title: "Impact",
                copy: "Track the water and lives you save with every meal. Visualize your positive footprint.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="group rounded-2xl border border-[#eef2f1] bg-white p-8 transition-all duration-300 hover:border-[#16695b]/30 hover:shadow-[0_20px_40px_-10px_rgba(22,105,91,0.08)]"
              >
                <div className="mb-6 flex size-14 items-center justify-center rounded-xl bg-[#e3ebe9] text-[#16695b] transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-3xl">{card.icon}</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-[#121716]">{card.title}</h3>
                <p className="leading-relaxed text-[#66857f]">{card.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="partners" className="overflow-hidden bg-[#f6f9f8] py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="mb-6 inline-block">
                <span className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#66857f]">
                  Smart Recommendation Engine
                </span>
              </div>
              <h2 className="mb-6 text-3xl font-bold leading-tight text-[#121716] lg:text-4xl">
                See the difference instantly.
                <br />
                <span className="text-[#16695b]">Better for you, better for the planet.</span>
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-[#66857f]">
                Our algorithm matches nutritional profiles and flavor textures to suggest the perfect plant-based swap.
                You won't miss a thing.
              </p>
              <ul className="mb-8 space-y-4">
                {["Verified nutritional data", "Local restaurant availability", "Real-time impact tracking"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#16695b]">check_circle</span>
                    <span className="font-medium text-[#121716]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-40 blur-3xl" />
                <div className="relative mx-auto max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
                  <div className="relative mb-6">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="material-symbols-outlined text-gray-400">search</span>
                    </div>
                    <input
                      readOnly
                      value="Chicken Biryani"
                      className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-500 focus:bg-white focus:outline-none sm:text-sm font-medium"
                    />
                  </div>
                  <div className="relative z-10 -mt-9 mb-4 flex justify-center">
                    <div className="rounded-full border border-gray-100 bg-white p-1 shadow-sm">
                      <span className="material-symbols-outlined text-sm text-gray-400">arrow_downward</span>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div className="relative h-48">
                      <img alt="Jackfruit Biryani with spices" src={cardImage} className="h-full w-full object-cover" />
                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-bold text-green-800 backdrop-blur shadow-sm">
                        <span className="material-symbols-outlined text-[16px] text-green-600">eco</span>
                        Top Match
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-[#121716]">Kathal (Jackfruit) Biryani</h3>
                          <p className="text-sm text-[#66857f]">By Spice Route Kitchen</p>
                        </div>
                        <span className="rounded bg-green-100 px-2 py-1 text-xs font-bold text-green-800">₹320</span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1 rounded-lg bg-[#e3ebe9]/50 p-3">
                          <div className="flex items-center gap-1 text-[#16695b]">
                            <span className="material-symbols-outlined text-[18px]">water_drop</span>
                            <span className="text-xs font-bold uppercase">Saved</span>
                          </div>
                          <span className="font-bold text-[#121716]">900 Liters</span>
                        </div>
                        <div className="flex flex-col gap-1 rounded-lg bg-orange-50 p-3">
                          <div className="flex items-center gap-1 text-orange-600">
                            <span className="material-symbols-outlined text-[18px]">pets</span>
                            <span className="text-xs font-bold uppercase">Saved</span>
                          </div>
                          <span className="font-bold text-[#121716]">1 Animal Life</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-[#66857f]">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="font-medium">High Fiber</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="font-medium">High Protein</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="relative flex flex-col items-center gap-8 overflow-hidden rounded-2xl bg-[#16695b] p-8 text-white shadow-lg md:flex-row md:p-12">
            <div className="absolute inset-0 opacity-10" />
            <div className="relative flex justify-center md:w-1/3 md:justify-start">
              <div
                className="h-24 w-24 rounded-full border-4 border-white/20 bg-cover bg-center shadow-lg md:h-32 md:w-32"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDycMcRMqDRZp5HcOLzmy3kfdg8C-wDXIA91ttPUoZK2XF94vjtQNhLCjJ0KZ828X5YxHEnw2IJCT7aNunXSUpuhb3VrQ12qfodxArqJSkgUi-EmbIt8oEuOPyVmYRZsouuWcsJpt9UGLDbtbEk4hLC_-O9YbGSeO88-N70RWAytXkcU_2gVicJBxFx3DjkjqiYQYnJ3gyBhx8rIDwzBVIKuF5TTSdj1_VqPv4gDdc1jZDhkjtseW08MzryOkL8j44yIRNdT10f3sH6')",
                }}
              />
            </div>
            <div className="relative text-center text-white md:w-2/3 md:text-left">
              <span className="mb-4 block text-4xl opacity-50">“</span>
              <p className="mb-6 text-xl font-medium leading-relaxed md:text-2xl">
                "I never thought I could give up my Sunday mutton curry. But the mushroom galouti swap was insane. Same
                texture, better feeling afterwards."
              </p>
              <div>
                <p className="text-lg font-bold">Priya Sharma</p>
                <p className="text-sm opacity-80">Marketing Executive, Mumbai</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-[#dceae5] py-24">
        <div className="mx-auto max-w-[1280px] px-6 text-center">
          <h2 className="mb-6 text-4xl font-black tracking-tight text-[#121716] lg:text-5xl">Start with one meal.</h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-[#121716]/70">
            Join 10,000+ others anywhere making a difference. It's free, it's delicious, and it's impactful.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <button className="flex h-14 items-center justify-center rounded-xl bg-[#16695b] px-10 text-lg font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-[#104f44]">
              Get Started Free
            </button>
          </div>
          <p className="mt-8 text-sm text-[#66857f]">No credit card required. Pure flavor.</p>
        </div>
      </section>

      <footer className="border-t border-[#dce4e3] bg-white py-12">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded bg-[#16695b] text-white">
              <span className="material-symbols-outlined text-sm">eco</span>
            </div>
            <span className="font-bold text-[#121716]">PlantSwap</span>
          </div>
          <div className="flex gap-8 text-sm text-[#66857f]">
            <a className="hover:text-[#16695b]" href="#">Privacy</a>
            <a className="hover:text-[#16695b]" href="#">Terms</a>
            <a className="hover:text-[#16695b]" href="#partners">Restaurants</a>
          </div>
          <p className="text-sm text-[#66857f]">© 2026 PlantSwap India.</p>
        </div>
      </footer>
    </div>
  );
}
