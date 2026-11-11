import { GuidePage } from "../../components/GuidePage";

export default function ChatParaComunidadesGaming() {
  return (
    <GuidePage
      title="Chat para comunidades de videojuegos"
      eyebrow="PARA CLANES, EQUIPOS Y AMIGOS"
      heading="Un lugar para reunir a tu grupo de juego."
      description="Organiza tu comunidad con canales de texto, salas de voz y la opción de compartir pantalla. Usa Meldiq en el navegador, en Windows o en Android."
      sections={[
        {
          title: "Crea un espacio para tu grupo",
          text: "Empieza con una comunidad por invitación. Crea un canal de anuncios para los horarios de las partidas, otro para buscar jugadores y uno general para conversar. Fija el horario para que todos puedan encontrarlo al entrar.",
          href: "/tutorials",
          label: "Guía de primeros pasos (en inglés)",
        },
        {
          title: "Habla con tus amigos entre partidas",
          text: "Abre una sala de voz para que cada persona se una cuando esté lista. Si juegan en equipos distintos, añade otra sala. Para mostrar una repetición o ayudar a alguien a configurar el juego, comparte tu pantalla desde un dispositivo compatible.",
          href: "/voice-video-screen-sharing",
          label: "Guía para compartir pantalla (en inglés)",
        },
        {
          title: "Revisa los permisos antes de invitar",
          text: "Crea un rol para moderadores y decide quién puede leer o publicar en cada canal. Por ejemplo, todos pueden leer los anuncios y solo los organizadores pueden publicarlos. Comprueba qué ve un miembro antes de enviar las invitaciones.",
          href: "/features#moderation",
          label: "Herramientas de moderación (en inglés)",
        },
        {
          title: "Haz una prueba con unos amigos",
          text: "Crea un canal de texto y una sala de voz. Pide a tus amigos que entren, envíen un mensaje y prueben a compartir pantalla desde sus dispositivos habituales. Así podrán resolver dudas sobre permisos o el micrófono antes de la próxima partida.",
          href: "/signup",
          label: "Crear una cuenta gratis (página en inglés)",
        },
      ]}
    >
      <p className="wrap">
        <a className="inline-link" href="/gaming-community-chat" hrefLang="en" lang="en">
          Read in English
        </a>
      </p>
    </GuidePage>
  );
}
