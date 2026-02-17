import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "jester24-delivery-address";

type DeliveryAddressState = {
  /** Adresa de livrare selectată (doar din lista Sulina). */
  address: string;
  setAddress: (address: string) => void;
  clearAddress: () => void;
};

export const useDeliveryAddressStore = create<DeliveryAddressState>()(
  persist(
    (set) => ({
      address: "",
      setAddress: (address) => set({ address: address.trim() }),
      clearAddress: () => set({ address: "" }),
    }),
    { name: STORAGE_KEY }
  )
);
