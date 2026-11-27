/* Le Studio est construit par Vite : importer une image donne l'adresse
   du fichier, copié dans le Studio publié. */
declare module '*.png' {
  const adresse: string
  export default adresse
}

/* La police du site (Archivo), dessinée dans les visuels Instagram. */
declare module '*.woff2' {
  const adresse: string
  export default adresse
}
