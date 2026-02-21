# Mentor Feedback Doc

## 1. Project Summary & Current Stage

**Project Summary:** OffRamp is a web-first plant-based transition platform that guides users from non-veg to plant-forward eating through dish-to-dish substitutions. The current stack combines a Next.js front-end, Supabase for auth/profile data, a FastAPI “plant-search” service for recommendations, and a WhatsApp companion bot for lightweight, conversational guidance.

**Current Stage:**

● Ideation / Research  
● **Prototype / MVP (current)**  
● Beta / Testing  
● Launched / Live  
● Scaling  

**Challenges / Blockers:**
● Dependence on the FastAPI recommendation service and Supabase setup for end-to-end flows—without these running locally, the swap experience cannot be fully exercised or demoed.  
● Limited structured user feedback to validate the current swap journeys and messaging; need more interviews/surveys with target segments.  
● Coverage and quality of dish mappings and substitution data are still thin, which constrains recommendation richness and confidence.  
● Pitch and positioning need tightening (diet transition narrative, value prop for partners) to unlock outreach and early pilots.  

## 2. Future Scope of the Project  
### Short-Term Goals (Next 1–3 Months)  
● Consolidate existing research and ideation work into a clear project brief or design document that can be picked up by future contributors or collaborators.  
● Build a functional prototype that is able to demonstrate all of the core features that we are suggesting in the pitches.  
● Establish an initial user feedback loop by engaging with a few users, understanding what their needs are, and analyzing the results of the survey conducted.  
● Understand how the user story looks like and what kind of partnerships are we looking at for any future perspectives.  
● Work on creating better pitches with more confidence and more content targeted on the kind of investors that we are trying to approach.  
### Long-Term Vision (6–12 Months)  
● Evolve the prototype into a minimum viable product (MVP) with a clear deployment path — either as a standalone tool or as a module that integrates into the broader OpenPAWS open-source ecosystem (e.g., via n8n workflows, OpenPAWS tools platform, or the vibe-coding framework).  
● Reach out to brands, cloud kitchens, or restaurants as a whole to understand what kind of dishes can be prepared. Also, consider the point discussed regarding the vegan or dietary kits that we are trying to propose.  
### Scalability & Impact Potential  
● This project has great potential to serve across a lot of different countries, especially with the animal welfare and animal advocacy organizations and communities that can help people to get onboarded and try to transition into more sustainable diets.  
● If successful, the approach could be replicated for adjacent cause areas (e.g., environmental conservation, food systems transformation) given the overlap in stakeholders and data.  
● I also believe that converting this into a business model could be very relevant in terms of partnering with organizations or maybe using a subscription-based model. That can be discussed once the prototype and once the pitches are in hand and ready.  

## 3. Feedback & Pointers to Keep in Mind  
### Strengths  
● The team has good technical expertise and good understanding of what the project is, which is a good thing when it comes to focusing and narrowing down the scope of the project.  
● The team members Prasad, Sandesh, and Anshuman that I have listened to right up until now can communicate well with the idea that they are formulating, and can explain how the problems or the challenges are being faced and how they could be solved with a good critical thinking ability.  
### Areas for Improvement  
● Pitches can be a little bit better in regards to the confidence and the way the project is being portrayed.  
● The team should sit down and understand how they are going to market this product, like discussed in the previous call. Marketing the product as a diet transition platform could be a great move, but if any further changes are required in that area, we can discuss it on the next call.  
### Key Pointers / Recommendations  
● Prioritize building one thing well over spreading effort across multiple features — a focused prototype with a clear use case will be more valuable than a broad but shallow tool.  
● Document everything: architecture decisions, data sources, user feedback, and lessons learned. This is critical for open-source continuity and for any future team that picks up the work.  
● Engage early and often with the intended end-users.  
● People who are trying to change habits or are trying to transition into some alternative food options are not really patient with the amount of buttons or the amount of things that they need to click. I would suggest keeping the application as simple and as frictionless as possible. Although the MVP is pretty good, maybe there are a few pointers that could be kept in mind while moving forward to Week 3.  

## 4. Resources / Support Needed
● Scheduled access to target users (non-veg, flexitarian segments) for interviews, surveys, and moderated usability tests.  
● Product/UX storytelling support to sharpen the pitch, visuals, and low-friction onboarding/flows.  
● Culinary/nutrition SME input to expand and validate substitution mappings and ensure regional relevance.  
● Stable staging infrastructure (Supabase + FastAPI) with monitoring so demos and pilots stay reliable; modest credits for hosting/usage.  
● Warm introductions to restaurants/brands/cloud kitchens for pilot partnerships and dish data collaboration.  
