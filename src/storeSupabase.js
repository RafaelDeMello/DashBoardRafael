import { create } from "zustand";
import { supabase } from "./lib/supabaseClient";

const useStore = create((set, get) => ({
  user: null,
  userProfile: null,
  isLoading: false,
  error: null,

  transactions: [],
  categories: [],
  creditCards: [],
  creditCardInvoices: [],

  // ====================================
  // USUÁRIO E PERFIL
  // ====================================
  setUser: (user) => set({ user }),

  loadUserProfile: async (userId) => {
    if (!userId) {
      console.warn("⚠ userId não fornecido");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        console.log(
          "📝 Perfil não encontrado, criando novo perfil para:",
          userId,
        );

        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([{ id: userId }])
          .select()
          .single();

        if (createError) {
          console.error("Erro ao criar perfil:", createError);
          return;
        }

        set({ userProfile: newProfile });
        return;
      }

      if (error) {
        console.error("Erro ao carregar perfil:", error);
        return;
      }

      set({ userProfile: data });
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
    }
  },

  updateUserProfile: async (userId, updates) => {
    try {
      // Primeiro verifica se o perfil existe
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();

      // Se não existe, cria primeiro
      if (checkError && checkError.code === "PGRST116") {
        console.log("📝 Criando perfil antes de atualizar...");
        const { error: insertError } = await supabase
          .from("profiles")
          .insert([{ id: userId, ...updates }]);

        if (insertError) throw insertError;

        // Recarrega o perfil
        const { data: newProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        set({ userProfile: newProfile });
        return newProfile;
      }

      // Se existe, faz o update
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;

      set({ userProfile: data });
      return data;
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      throw err;
    }
  },

  uploadAvatar: async (userId, file) => {
    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Formato inválido. Use: JPEG, PNG, GIF ou WEBP.");
    }
    // Validar tamanho do arquivo
    const maxSizeMB = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSizeMB) {
      throw new Error("Arquivo muito grande. Máximo permitido: 2MB.");
    }
    // Validar se realmente é uma imagem
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    const getFileExtension = (fileObj) => {
      if (fileObj.type === "image/jpeg") return "jpg";
      if (fileObj.type === "image/png") return "png";
      if (fileObj.type === "image/gif") return "gif";
      if (fileObj.type === "image/webp") return "webp";

      const fallback = String(fileObj.name || "")
        .split(".")
        .pop()
        .toLowerCase();
      return fallback || "jpg";
    };

    const getStoragePathFromPublicUrl = (publicUrl, bucket) => {
      if (!publicUrl) return null;

      const marker = `/storage/v1/object/public/${bucket}/`;
      const markerIndex = publicUrl.indexOf(marker);
      if (markerIndex === -1) return null;

      const pathWithQuery = publicUrl.substring(markerIndex + marker.length);
      const path = pathWithQuery.split("?")[0];
      return decodeURIComponent(path);
    };

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        URL.revokeObjectURL(objectUrl);

        // 4. Validar dimensões (máximo 1280x1280)
        if (img.width > 1280 || img.height > 1280) {
          reject(new Error("Imagem muito grande. Máx: 1280x500px"));
          return;
        }

        try {
          const previousAvatarUrl = get().userProfile?.avatar_url || null;

          // 5. Criar caminho único: userId/avatar-<timestamp>.<ext>
          const fileExtension = getFileExtension(file);
          const filePath = `${userId}/avatar-${Date.now()}.${fileExtension}`;

          // 6. Fazer upload para o Supabase Storage
          const { error } = await supabase.storage
            .from("avatars")
            .upload(filePath, file, { upsert: false });

          if (error) throw error;

          // 7. Obter URL pública
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(filePath);

          // 8. Persistir imediatamente no perfil
          await get().updateUserProfile(userId, { avatar_url: publicUrl });

          // 9. Remover arquivo antigo, se existir
          const oldPath = getStoragePathFromPublicUrl(previousAvatarUrl, "avatars");
          if (oldPath && oldPath !== filePath) {
            const { error: removeError } = await supabase.storage
              .from("avatars")
              .remove([oldPath]);

            if (
              removeError &&
              !String(removeError.message || "")
                .toLowerCase()
                .includes("not found")
            ) {
              console.warn(
                "Aviso: não foi possível remover avatar antigo:",
                removeError.message,
              );
            }
          }

          resolve(publicUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Arquivo corrompido ou inválido"));
      };

      img.src = objectUrl;
    });
  },

  removeAvatar: async (userId) => {
    try {
      const avatarUrl = get().userProfile?.avatar_url || null;
      const marker = "/storage/v1/object/public/avatars/";
      let filePath = null;

      if (avatarUrl && avatarUrl.includes(marker)) {
        const pathWithQuery = avatarUrl.split(marker)[1] || "";
        filePath = decodeURIComponent(pathWithQuery.split("?")[0]);
      }

      // 1) Tenta remover arquivo do Storage
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from("avatars")
          .remove([filePath]);

        // Se não encontrou o arquivo, seguimos; outros erros param
        if (
          storageError &&
          !String(storageError.message || "")
            .toLowerCase()
            .includes("not found")
        ) {
          throw storageError;
        }
      }

      // 2) Remove referência no perfil (persistência)
      const { data, error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;

      // 3) Atualiza estado global
      set({ userProfile: data });
      return data;
    } catch (err) {
      console.error("Erro ao remover avatar:", err);
      throw err;
    }
  },

  // ====================================
  // CARTÕES DE CRÉDITO
  // ====================================
  loadCreditCards: async (userId) => {
    if (!userId) return;

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("credit_cards")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;

      set({ creditCards: data, isLoading: false });
    } catch (err) {
      console.error("Erro ao carregar cartões:", err);
      set({ error: err.message, isLoading: false });
    }
  },

  addCreditCard: async (cardData) => {
    try {
      let userId = get().user?.id;
      if (!userId) {
        const { data: authData } = await supabase.auth.getUser();
        userId = authData?.user?.id;
      }

      if (!userId) throw new Error("Sem usuário autenticado");

      const { data, error } = await supabase
        .from("credit_cards")
        .insert([{ ...cardData, user_id: userId }])
        .select();

      if (error) throw error;

      await get().loadCreditCards(userId);
      return data[0];
    } catch (err) {
      console.error("Erro ao adicionar cartão:", err);
      set({ error: err.message });
      throw err;
    }
  },

  updateCreditCard: async (cardId, updates) => {
    try {
      const { data, error } = await supabase
        .from("credit_cards")
        .update(updates)
        .eq("id", cardId)
        .select();

      if (error) throw error;

      const userId = get().user?.id;
      if (userId) await get().loadCreditCards(userId);
      return data[0];
    } catch (err) {
      console.error("Erro ao atualizar cartão:", err);
      set({ error: err.message });
      throw err;
    }
  },

  deleteCreditCard: async (cardId) => {
    try {
      const { error } = await supabase
        .from("credit_cards")
        .update({ is_active: false })
        .eq("id", cardId);

      if (error) throw error;

      const userId = get().user?.id;
      if (userId) await get().loadCreditCards(userId);
    } catch (err) {
      console.error("Erro ao deletar cartão:", err);
      throw err;
    }
  },

  // ====================================
  // FATURAS
  // ====================================
  loadInvoices: async (cardId) => {
    try {
      const { data, error } = await supabase
        .from("credit_card_invoices")
        .select("*")
        .eq("credit_card_id", cardId)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (error) throw error;

      set({ creditCardInvoices: data });
      return data;
    } catch (err) {
      console.error("Erro ao carregar faturas:", err);
      set({ error: err.message });
      return [];
    }
  },

  markInvoicePaid: async (invoiceId) => {
    try {
      const { data, error } = await supabase
        .from("credit_card_invoices")
        .update({ paid: true, paid_date: new Date().toISOString() })
        .eq("id", invoiceId)
        .select();

      if (error) throw error;

      const card = get().creditCards[0];
      if (card) await get().loadInvoices(card.id);
      return data[0];
    } catch (err) {
      console.error("Erro ao marcar fatura como paga:", err);
      set({ error: err.message });
      throw err;
    }
  },

  getMonthInvoice: (cardId) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    return get().creditCardInvoices.find(
      (inv) =>
        inv.credit_card_id === cardId &&
        inv.month === month &&
        inv.year === year,
    );
  },

  // ====================================
  // TRANSAÇÕES (apenas carregar - para gráficos)
  // ====================================
  loadTransactions: async (userId) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (error) throw error;

      set({ transactions: data || [] });
    } catch (err) {
      console.error("Erro ao carregar transações:", err);
    }
  },

  loadCategories: async (userId) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      set({ categories: data || [] });
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  },

  // ====================================
  // LIMPAR DADOS (LOGOUT)
  // ====================================
  clearData: () => {
    set({
      transactions: [],
      categories: [],
      creditCards: [],
      creditCardInvoices: [],
      user: null,
      error: null,
    });
  },
}));

export default useStore;
