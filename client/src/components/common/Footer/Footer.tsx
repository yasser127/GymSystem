import React from "react";
import { Phone, Instagram, MapPin } from "lucide-react";

type FooterProps = {
  phone?: string;
  instagramUrl?: string;
  googleMapsUrl?: string;
  address?: string;
  className?: string;
};

const PROJECT_GRADIENT =
  "linear-gradient(90deg, rgba(91,33,182,1) 0%, rgba(124,58,237,1) 45%, rgba(167,139,250,1) 100%)";
// to be changed
export default function Footer({
  phone = "+961 70 xxx xxx",
  instagramUrl = "https://www.instagram.com/gymclublebanon?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", // to be changed
  googleMapsUrl = "https://www.google.com/maps/search/?api=1&query=Hamra+Beirut", 
  address = "Hamra, Beirut, Lebanon",
  className = "",
}: FooterProps): React.ReactElement {
  return (
    <footer
      className={`w-full ${className}`}
      style={{ background: PROJECT_GRADIENT, color: "white" }}
      aria-label="Site footer"
    >
      <div className="max-w-5xl mx-auto px-6 py-8 md:flex md:items-center md:justify-between">
        <div className="mb-6 md:mb-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shadow"
              style={{ background: PROJECT_GRADIENT, color: "white" }}
              aria-hidden
            >
              FF
            </div>
            <div>
              <div className="font-semibold">Gym Name go here</div>
              <div className="text-sm text-white/80">Built with ❤️ in Tyre</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6 text-sm">
          <a
            href={`tel:${phone.replace(/\s+/g, "")}`}
            className="flex items-center gap-3 group"
            aria-label={`Call ${phone}`}
          >
            <span className="p-2 rounded-md bg-white/10 group-hover:bg-white/20">
              <Phone size={18} />
            </span>
            <span className="text-white">{phone}</span>
          </a>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group"
            aria-label="Open Instagram profile"
          >
            <span className="p-2 rounded-md bg-white/10 group-hover:bg-white/20">
              <Instagram size={18} />
            </span>
            <span className="text-white">@Gym-tag</span>
          </a>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group"
            aria-label="Open location in Google Maps"
          >
            <span className="p-2 rounded-md bg-white/10 group-hover:bg-white/20">
              <MapPin size={18} />
            </span>
            <span className="text-white">{address}</span>
          </a>
        </div>
      </div>

      
    </footer>
  );
}
