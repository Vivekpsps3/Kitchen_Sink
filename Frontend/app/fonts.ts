import localFont from "next/font/local"

export const gaya = localFont({
  src: [
    {
      path: "../public/fonts/gayatrial-italic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/gayatrial-regular.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-gaya",
})

export const matina = localFont({
  src: [
    {
      path: "../public/fonts/Matina-Regular.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-matina",
})
