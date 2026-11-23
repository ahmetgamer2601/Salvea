// Öğretmen: sınıf/takım sohbetinin tüm geçmişini HERKES İÇİN kalıcı siler (ör. yayına almadan önce deneme mesajlarını temizlemek).
// Önce sohbet belgesine "temizTs" yazılır: herkesin ekranında eski mesajlar anında gizlenir. Sonra mesajlar 400'er 400'er silinir.
// Maliyet: silinen mesaj sayısı kadar okuma + silme (yalnızca bu işlemde). Güvenlik üst sınırı: 4000 mesaj.
import { db } from "./firebase.js";
import { doc, updateDoc, serverTimestamp, collection, query, orderBy, limit, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

export async function herkesIcinTemizle(chatId, ilerleme) {
  await updateDoc(doc(db, "sohbetler", chatId), { temizTs: serverTimestamp(), son: null });
  let toplam = 0;
  for (let tur = 0; tur < 10; tur++) {
    const s = await getDocs(query(collection(db, "sohbetler", chatId, "mesajlar"), orderBy("ts"), limit(400)));
    if (s.empty) break;
    const b = writeBatch(db); s.docs.forEach(d => b.delete(d.ref)); await b.commit(); toplam += s.size; if (ilerleme) ilerleme(toplam);
    if (s.size < 400) break;
  }
  return toplam;
}
