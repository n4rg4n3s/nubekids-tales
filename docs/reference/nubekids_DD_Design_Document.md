# **UI/UX Design Document: Magic Sneakers**

## **1\. Design Vision & Principles**

El objetivo visual de "Magic Sneakers" es crear un entorno que se sienta **mágico, táctil y seguro para los niños**, pero lo suficientemente estructurado e intuitivo para que los padres (los usuarios principales del Setup) puedan navegarlo sin fricción.

* **Tactile (Táctil):** Los botones y tarjetas deben parecer objetos físicos que se pueden presionar (sombras duras, bordes gruesos, efecto de hundimiento al hacer clic).  
* **Playful (Divertido):** Uso de colores vibrantes pero no saturados al extremo (tonos pastel vibrantes), tipografías redondeadas y micro-interacciones (rebotes, confeti).  
* **Focused (Enfocado):** Reducir el ruido visual. Un paso a la vez.

## **2\. Visual Identity & Design System**

### **2.1. Color Palette**

* **Background (Fondo):** Soft Cream (\#FDFBF7) \- Evita la fatiga visual del blanco puro y da una sensación de página de libro.  
* **Primary Brand (Mágico):** Magic Purple (\#8B5CF6) \- Usado para elementos principales y acentos de marca.  
* **Action/Accent (Zapatillas):** Sneaker Yellow (\#FBBF24) \- Usado para el botón principal de "Start Adventure" y llamadas a la acción destacadas.  
* **Secondary/UI Elements:** Sky Blue (\#38BDF8) y Mint Green (\#34D399) para estados de éxito (ej. imagen subida correctamente).  
* **Text & Borders:** Ink Black (\#1E293B) \- Un gris muy oscuro/azulado para el texto y los bordes gruesos de los elementos táctiles.

### **2.2. Typography**

* **Display / Headings:** Fredoka One o Bangers (Google Fonts). Gruesa, redondeada, con mucha personalidad. Usada para títulos ("MAGIC SNEAKERS") y botones gigantes.  
* **Body / UI Text:** Nunito o Quicksand (Google Fonts). Sans-serif redondeada, altamente legible para los padres en los menús y para los niños en los textos del cuento.

### **2.3. Core UI Components**

* **Botones Táctiles (Tactile Buttons):**  
  * Borde sólido de 3px a 4px Ink Black.  
  * Sombra dura (Box-shadow: 4px 4px 0px \#1E293B).  
  * *Hover state:* La sombra se reduce a 2px 2px y el botón se traslada 2px hacia abajo y a la derecha (efecto de ser presionado).  
*   
* **Tarjetas de Subida de Imagen (Upload Cards):**  
  * Fondo blanco, borde punteado grueso (dashed 4px) en color azul o morado claro.  
  * Cuando se sube una imagen, el borde cambia a verde sólido y la imagen aparece con un ligero ángulo de rotación (estilo foto Polaroid) para darle un toque orgánico.  
* 

---

## **3\. Screen Specifications & Wireframes**

### **Screen 1: The Gate (API Key Modal)**

* **Layout:** Modal centrado sobre un fondo oscuro desenfocado (Blur).  
* **Visuals:** Un icono de una llave mágica o un candado animado.  
* **UI Elements:**  
  * Título grande: "Unlock the Magic".  
  * Input field: Borde grueso, texto grande, placeholder amigable ("Paste your secret key here...").  
  * Botón: Sneaker Yellow, texto "ENTER MULTIVERSE".  
* 

### **Screen 2: The Cast & Story (Setup Dashboard)**

* **Layout:** Diseño de dos columnas en Desktop, apilado (stacked) en Mobile. Contenedor principal estilo "tarjeta gigante" ligeramente rotada (1 grado) para romper la rigidez.  
* **Columna Izquierda (The Cast):**  
  * **Hero Section:** Tarjeta de subida para "Hero's Face" y justo debajo "Hero's Shoes".  
  * **Co-Star Section:** Tarjeta similar, pero con colores secundarios (ej. lila en lugar de azul) indicando que es opcional.  
  * *Interacción:* Al subir una foto, la tarjeta hace una animación de "pop" y muestra un badge verde de "✓ READY".  
*   
* **Columna Derecha (The Story):**  
  * **Dropdowns:** Selectores para "Genre" y "Language". Deben parecer botones grandes que despliegan opciones, no el \<select\> nativo aburrido del navegador.  
  * **Toggle:** Un interruptor (switch) grueso y redondeado para "Novel Mode".  
*   
* **Sticky Footer / Bottom Action:**  
  * Botón gigante a todo el ancho del contenedor: "START ADVENTURE\!". Deshabilitado (gris) hasta que Hero Face y Hero Shoe estén subidos.  
* 

### **Screen 3: The Reading Experience (The Book UI)**

* **Layout:** El fondo cambia a un color oscuro o un patrón sutil para que el libro resalte. En el centro, un contenedor que simula un libro físico (relación de aspecto 2:3 o similar a un iPad en vertical).  
* **Visuals del Libro:**  
  * Sombra paralela suave y amplia para separar el libro del fondo.  
  * Efecto de página (una línea sutil en el borde derecho que simula el grosor de las páginas).  
*   
* **Contenido de la Página (Panel):**  
  * **Imagen:** Ocupa el 60-70% superior de la página. Bordes redondeados o enmarcados como una ilustración clásica.  
  * **Texto (Caption/Dialogue):** Caja de texto en la parte inferior con tipografía Nunito grande y legible. Fondo de la caja de texto ligeramente crema para contrastar con la imagen.  
*   
* **Navegación:**  
  * Flechas flotantes a los lados del libro (Izquierda/Derecha) estilo burbuja.  
  * Indicador de página en la parte inferior (ej. "Page 2 of 10").  
*   
* **Decision Pages (Páginas Interactivas):**  
  * La imagen se oscurece ligeramente.  
  * Aparecen dos botones gigantes superpuestos (Opción A y Opción B) rebotando suavemente para llamar la atención del niño/padre.  
* 

### **Screen 4: The End & Export**

* **Layout:** Última página del libro (Back Cover).  
* **UI Elements:**  
  * Ilustración final de celebración.  
  * Botón primario (Sky Blue): "DOWNLOAD STORY" (Icono de PDF).  
  * Botón secundario (Mint Green): "CREATE NEW STORY" (Icono de recargar/magia).  
* 

---

## **4\. Animations & Micro-interactions (The "Delight" Factor)**

Para que la app no se sienta como un formulario de base de datos, el equipo de Frontend debe implementar las siguientes animaciones (recomendado usar Framer Motion o CSS puro):

1. **Pow/Pop Enter:** Cuando el usuario hace clic en "Start Adventure", el formulario no desaparece de golpe. Hace un pequeño zoom in y luego sale volando hacia arriba (Knockout exit), revelando el libro debajo.  
2. **Page Turn:** Al cambiar de página, usar una transición de deslizamiento (slide) suave o un efecto de "flip" 3D si el rendimiento lo permite.  
3. **Loading State (Inking...):** Mientras Gemini genera la siguiente página, mostrar un icono de un lápiz dibujando o unas zapatillas caminando en el lugar, con el texto "Drawing your magic shoes..." parpadeando suavemente.  
4. **Hover States:** Todos los elementos interactivos deben escalar ligeramente hacia arriba (scale: 1.05) al pasar el ratón por encima, indicando que son "tocables".

---

**Instrucciones para el equipo de Desarrollo:**  
Utilicen este documento junto con el PRD para estructurar los componentes de React y las clases de Tailwind CSS. La prioridad es mantener la interfaz limpia, los botones grandes (amigables para pantallas táctiles) y asegurar que las imágenes subidas por el usuario se previsualicen claramente antes de generar la historia.  
