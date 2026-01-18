import Image from "next/image";
import { HeaderNav } from "../components/HeaderNav";

export default function WhatsAppPage() {
  // TODO: replace `qrSrc` with the provided QR image path when available.
  const qrSrc = "/code.webp";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9fbf9] via-white to-[#eef6ef]">
      <div className="px-4 py-4 sm:px-6 lg:px-10">
        <HeaderNav />
      </div>
      <main className="flex items-center justify-center px-6 pb-20 pt-6">
        <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5">
          <div className="flex flex-col items-center gap-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Assistant</h1>
            <p className="text-gray-600">
              Scan the QR code below to start chatting with the assistant on WhatsApp.
            </p>
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6">
              <Image
                src={qrSrc}
                alt="WhatsApp assistant QR"
                width={320}
                height={320}
                className="rounded-xl shadow-sm"
                priority
              />
            </div>
            <p className="text-sm text-gray-500">
              If the QR does not load, please refresh or replace the placeholder path with the provided image.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
