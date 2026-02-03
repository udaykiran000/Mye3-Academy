import React from "react";
import { Star } from "lucide-react";

// Static Testimonial Data (Kept same)
const TESTIMONIALS = [
  {
    _id: "1",
    name: "Aarav Sharma",
    role: "UPSC Aspirant",
    quote:
      "The All-India Grand Tests were a game-changer. The ranking system is precise and showed me exactly where I stood. Highly recommended!",
    avatar: "https://placehold.co/100x100/EEF2FF/4F46E5?text=AS",
  },
  {
    _id: "2",
    name: "Priya Singh",
    role: "Banking Aspirant",
    quote:
      "I love the category-wise mock tests. The quality of questions is top-notch, and the instant analysis helped me focus on my weak areas.",
    avatar: "https://placehold.co/100x100/ECFEFF/0891B2?text=PS",
  },
  {
    _id: "3",
    name: "Rohan Gupta",
    role: "SSC CGL Aspirant",
    quote:
      "A fantastic platform. The interface is clean, easy to use, and bug-free. The instructor support feature is a brilliant addition.",
    avatar: "https://placehold.co/100x100/F0F9FF/0284C7?text=RG",
  },
];

const TestimonialsSection = () => (
  <section id="testimonials" className="py-24 bg-white text-slate-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header - Bold & Deep Navy */}
      <h2 className="text-4xl md:text-5xl font-black text-center mb-16 text-slate-900 tracking-tighter uppercase">
        What Our <span className="text-indigo-600">Users Say</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TESTIMONIALS.map((item) => (
          <div
            key={item._id}
            className="bg-white p-8 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-500 transform hover:-translate-y-2"
          >
            {/* Star Rating */}
            <div className="flex mb-5">
              {Array(5)
                .fill()
                .map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-amber-400 text-amber-400"
                  />
                ))}
            </div>

            {/* Quote - Slate Gray for Readability */}
            <p className="text-slate-600 font-medium italic mb-8 text-lg leading-relaxed">
              "{item.quote}"
            </p>

            <div className="flex items-center">
              <img
                className="h-14 w-14 rounded-2xl object-cover border-2 border-indigo-50 shadow-sm"
                src={item.avatar}
                alt={item.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://placehold.co/100x100/F1F5F9/64748B?text=User";
                }}
              />
              <div className="ml-4">
                <div className="text-base font-black text-slate-900 uppercase tracking-tighter">
                  {item.name}
                </div>
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                  {item.role}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
