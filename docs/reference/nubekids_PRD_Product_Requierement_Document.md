# **Product Requirement Document (PRD): Magic Sneakers Storybook Generator**

## **1\. Executive Summary & Product Vision**

**Concept in Simple Terms:**  
"Magic Sneakers" is an AI-powered web application that allows parents and children to generate highly personalized, beautifully illustrated digital storybooks. By uploading photos of a child (the Hero) and their favorite pair of shoes, the AI crafts a unique adventure where the child is the main character and their shoes possess magical properties to solve problems. Users can also add a Co-Star (friend/sibling) and their shoes, choose the art style, and select the language. The final product is an interactive digital book that can be downloaded as a PDF.

**Vision:**  
To make reading magical and deeply personal for children by putting them—and their favorite everyday items—directly into the center of high-quality, beautifully illustrated narratives.

## **2\. Target Audience**

* **Primary Users:** Parents, grandparents, and guardians looking for unique, personalized bedtime stories or gifts for their children.  
* **Secondary Users:** Educators and teachers wanting to create engaging, customized reading materials for their students.  
* **End Consumers:** Children aged 3-10 who will read or listen to the stories.

## **3\. Problem Statement & Value Proposition**

* **The Problem:** Traditional children's books are static and generic. While some personalized books exist (inserting a child's name), they rarely capture the child's actual likeness, and never include their specific personal items (like their favorite shoes or a best friend).  
* **The Solution:** Leveraging advanced multimodal AI (Gemini 3.1 Flash), this app maintains strict character and object consistency, generating a bespoke story where the child's actual face and real-life shoes are visually represented in every illustration.

## **4\. User Stories**

* **US1:** As a user, I want to upload a photo of my child's face so that the main character looks exactly like them.  
* **US2:** As a user, I want to upload a photo of my child's shoes so that those specific shoes become the magical items in the story.  
* **US3:** As a user, I want the option to add a Co-Star (and their shoes) so my child's sibling or best friend can join the adventure.  
* **US4:** As a user, I want to choose the art style (e.g., 3D Animation, Classic Fairytale) so the book matches my child's visual preferences.  
* **US5:** As a user, I want to select the language of the story so my child can read in their native tongue or practice a new language.  
* **US6:** As a reader, I want to make choices at certain points in the story to determine what happens next, making the experience interactive.  
* **US7:** As a user, I want to download the finished storybook as a PDF so I can print it or read it offline on a tablet.

## **5\. Functional Requirements**

### **5.1. Authentication & Onboarding**

* **API Key Input:** The app must prompt the user to securely input their Gemini API Key (stored locally in the browser) before accessing the generation features.

### **5.2. Story Setup Configuration (The "Cast & Story" Screen)**

* **Hero Configuration (Required):**  
  * Image upload for Hero's Face.  
  * Image upload for Hero's Shoes.  
*   
* **Co-Star Configuration (Optional):**  
  * Image upload for Co-Star's Face.  
  * Image upload for Co-Star's Shoes.  
*   
* **Story Parameters:**  
  * **Genre Dropdown:** Options must include *3D Animation Magic, Classic Fairytale, Anime Adventure, Whimsical Claymation, Custom*.  
  * **Language Dropdown:** Options must include *English, Spanish, French, Portuguese, Italian*.  
  * **Custom Premise (Text Area):** Visible only if "Custom" genre is selected, allowing the user to type a specific plot.  
  * **Novel Mode (Toggle):** A checkbox to enable richer, longer text generation versus simple, short captions.  
*   
* **Validation:** The "Start Adventure" button must remain disabled until the Hero's Face and Hero's Shoes images are uploaded.

### **5.3. Core AI Generation Engine**

* **Narrative Generation:** The system must generate story beats (pages) sequentially. Each beat must include a descriptive scene, a narrative caption, optional dialogue, and the character focus.  
* **Interactive Branching:** On designated "Decision Pages" (e.g., Page 3), the AI must generate two distinct choices for the user. The story pauses until the user selects an option, which then dictates the narrative of the subsequent pages.  
* **Image Generation (Multimodal Consistency):** The system must use the uploaded images as strict references.  
  * When the Hero is in the scene, the AI must reference the Hero Face and Hero Shoe images.  
  * When the Co-Star is in the scene, the AI must reference the Co-Star Face and Co-Star Shoe images.  
*   
* **Content Moderation:** The system must enforce strict guardrails to ensure all generated text and images are wholesome, age-appropriate, and free of violence or dark themes.

### **5.4. Reading Experience (The Book UI)**

* **Layout:** The UI must simulate a physical book with a cover, internal pages, and a back cover.  
* **Navigation:** Users must be able to click/tap to turn pages forward and backward.  
* **Progressive Loading:** Pages should generate in batches. The user can start reading the first few pages while subsequent pages generate in the background. Loading states (e.g., "Inking page...") must be clearly visible.

### **5.5. Export & Reset**

* **PDF Download:** A "Download Story" button must compile all generated images into a paginated PDF file (portrait orientation, standard comic/book ratio) and trigger a download to the user's device.  
* **Reset:** A "Create New Story" button must clear all current state, history, and uploaded images, returning the user to the Setup screen.

## **6\. Non-Functional Requirements**

* **Performance:** Image uploads should be compressed/resized client-side (converted to base64) to ensure fast API payload transmission.  
* **Responsiveness:** The UI must be fully responsive, providing an excellent reading experience on both desktop monitors and mobile devices/tablets.  
* **Privacy:** Uploaded photos must not be stored on any permanent backend database by the application itself; they should only be held in browser memory and sent directly to the Gemini API for the duration of the session.

## **7\. Out of Scope for V1 (Future Enhancements)**

* User accounts and cloud saving of generated books.  
* Audio narration / Text-to-Speech (TTS) reading the story out loud.  
* Direct integration with physical print-on-demand services.  
* Video/Animation generation for the panels.

