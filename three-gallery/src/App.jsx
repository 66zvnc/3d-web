import React, { useState } from "react";
import GalleryView from "./GalleryView";
import ItemView from "./ItemView";

export default function App() {
  const [page, setPage] = useState({ view: "gallery", itemId: null });

  const goToItem = (id) => setPage({ view: "item", itemId: id });
  const goToGallery = () => setPage({ view: "gallery", itemId: null });

  if (page.view === "item") {
    return <ItemView itemId={page.itemId} onBack={goToGallery} />;
  }
  return <GalleryView onSelectItem={goToItem} />;
}
