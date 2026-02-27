const DEFAULT_IMAGE = "/assets/robot-tablet.png";

const BASE = "/assets/IMG Chatbots asignaturas";

/**
 * Each entry maps keyword fragments (accent-stripped, lowercase) to a folder
 * and its available images. Order matters — more specific entries first so
 * "física y química" matches before plain "física" or "química".
 */
const SUBJECT_IMAGE_MAP: { keywords: string[]; folder: string; images: string[] }[] = [
  {
    keywords: ["fisica y quimica"],
    folder: "Física y Química",
    images: ["Robot_física y química.jpg"],
  },
  {
    keywords: ["biologia y geologia"],
    folder: "Biología y gología",
    images: ["Robot_geólogo.jpg"],
  },
  {
    keywords: ["historia de espana"],
    folder: "16 Historia de España",
    images: ["Robot_conquistador.jpg", "Robot_escriba.jpg", "Robot_Reina.jpg"],
  },
  {
    keywords: ["ciencias naturales"],
    folder: "Ciencias naturales",
    images: ["Robot_micro.jpg", "Robot_planetas.jpg", "Robot_plantas.jpg"],
  },
  {
    keywords: ["lengua castellana"],
    folder: "Lengua Castellana y literatura",
    images: ["Robot_Cervantes.jpg", "Robot_chef.jpg", "Robot_Quijote.jpg"],
  },
  {
    keywords: ["educacion artistica", "plastica"],
    folder: "07 Educación Artística",
    images: ["Robot_Bob ross.jpg", "Robot_escultor.jpg", "Robot_pintor.jpg"],
  },
  {
    keywords: ["educacion fisica"],
    folder: "09 Educación física",
    images: ["Robot_basket.jpg", "Robot_football.jpg", "Robot_gimnasio.jpg"],
  },
  {
    keywords: ["matematicas", "matematica"],
    folder: "01Matemáticas",
    images: ["Robot mago.jpg", "Robot_matemático 2.jpg", "Robot_matemático.jpg"],
  },
  {
    keywords: ["lengua", "literatura"],
    folder: "03 Lengua y literatura",
    images: ["Robot_Domador de letras.jpg", "Robot_Profe lengua.jpg", "Robot_Profe lengua_escritor.jpg"],
  },
  {
    keywords: ["ingles", "english"],
    folder: "06 Inglés",
    images: ["Robot_guardia real.jpg", "Robot_londres 2.jpg", "Robot_londres.jpg"],
  },
  {
    keywords: ["quimica"],
    folder: "12 Química",
    images: ["Robot_químico 2.jpg", "Robot_químico 3.jpg", "Robot_químico.jpg"],
  },
  {
    keywords: ["biologia"],
    folder: "14 Biología",
    images: ["Robot_biólogo 2.jpg", "Robot_Biólogo marino.jpg", "Robot_biólogo.jpg"],
  },
  {
    keywords: ["geografia"],
    folder: "15 Geografía e Historia",
    images: ["Robot arqueólogo.jpg", "Robot_Griego.jpg", "Robot_Troglodita.jpg"],
  },
  {
    keywords: ["historia"],
    folder: "15 Geografía e Historia",
    images: ["Robot arqueólogo.jpg", "Robot_Griego.jpg", "Robot_Troglodita.jpg"],
  },
  {
    keywords: ["musica"],
    folder: "18 Música",
    images: ["Robot_Clásico.jpg", "Robot_Director de orquesta.jpg", "Robot_Punk.jpg"],
  },
  {
    keywords: ["economia"],
    folder: "Economía",
    images: ["Robot_economista.jpg"],
  },
  {
    keywords: ["filosofia"],
    folder: "Filosofía",
    images: ["Robot_Filosofía.jpg", "Robot_Platón.jpg", "Robot_Zen.jpg"],
  },
  {
    keywords: ["fisica"],
    folder: "Física",
    images: ["Robot_físico.jpg"],
  },
  {
    keywords: ["tecnologia", "digitalizacion"],
    folder: "Tecnología y digitalización",
    images: [],
  },
];

/** Strip accents and lowercase */
const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/**
 * Returns an image path for a given subject name.
 * Uses challengeId to deterministically pick one image from the set
 * so the same challenge always shows the same robot.
 */
export function getSubjectImage(
  subjectName: string | null | undefined,
  challengeId: number,
): string {
  if (!subjectName) return DEFAULT_IMAGE;

  const input = normalize(subjectName);

  for (const entry of SUBJECT_IMAGE_MAP) {
    if (entry.images.length === 0) continue;
    if (entry.keywords.some((kw) => input.includes(kw))) {
      const idx = Math.abs(challengeId) % entry.images.length;
      return `${BASE}/${entry.folder}/${entry.images[idx]}`;
    }
  }

  return DEFAULT_IMAGE;
}
