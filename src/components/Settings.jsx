import { useState, useEffect, useRef } from "react";
import { User, Save, X, Upload, Palette } from "lucide-react";
import useStore from "../storeSupabase";

const themeOptions = [
  { id: "slate", name: "Cinza", primary: "#475569", secondary: "#1e293b" },
  { id: "pink", name: "Rosa", primary: "#ec4899", secondary: "#be185d" },
  { id: "blue", name: "Azul", primary: "#0ea5e9", secondary: "#0369a1" },
  { id: "green", name: "Verde", primary: "#10b981", secondary: "#047857" },
  { id: "purple", name: "Roxo", primary: "#8b5cf6", secondary: "#6d28d9" },
  { id: "orange", name: "Laranja", primary: "#f59e0b", secondary: "#d97706" },
];

export default function SettingsPanel({ onClose }) {
  const user = useStore((state) => state.user);
  const userProfile = useStore((state) => state.userProfile);
  const loadUserProfile = useStore((state) => state.loadUserProfile);
  const updateUserProfile = useStore((state) => state.updateUserProfile);
  const uploadAvatar = useStore((state) => state.uploadAvatar);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    full_name: "",
    avatar_url: "",
    app_theme: "slate",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const buttonBg = "bg-slate-700 hover:bg-slate-800";
  const accentColor = "text-slate-600";

  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || "",
        avatar_url: userProfile.avatar_url || "",
        app_theme: userProfile.app_theme || "slate",
      });
    }
  }, [userProfile]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;
    try {
      //validar tipo de arquivo
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Tipo de arquivo não suportado. Use: JPEG, PNG, GIF ou WEBP.",
        );
        return;
      }
      // Validar o tamanho do arquivo
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("Arquivo muito grande. O limite é de 2MB.");
        return;
      }

      // Fazer upload
      setUploading(true);
      setMessage(null);

      const avatarUrl = await uploadAvatar(user.id, file);
      setFormData({ ...formData, avatar_url: avatarUrl });
      setMessage({ type: "success", text: "Avatar atualizado com sucesso!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const sanitizeText = (text) => {
    //remover tags HTML
    return text
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+="[^"]*"/g, "")
      .trim()
      .substring(0, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const now = Date.now();
    if (now - lastUpdateTime < 2000) {
      setMessage({
        type: "error",
        text: "Por favor, aguarde antes de salvar novamente.",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Filtrar apenas campos que têm valor para evitar erro de colunas inexistentes
      const updates = {};
      if (formData.full_name !== undefined)
        updates.full_name = sanitizeText(formData.full_name);
      if (formData.avatar_url !== undefined)
        updates.avatar_url = formData.avatar_url;
      if (formData.app_theme !== undefined)
        updates.app_theme = formData.app_theme;

      console.log("Salvando perfil:", updates);

      await updateUserProfile(user.id, updates);
      await loadUserProfile(user.id);

      setLastUpdateTime(now);

      setMessage({ type: "success", text: "Perfil atualizado com sucesso!" });
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setMessage({
        type: "error",
        text: "Erro ao atualizar perfil: " + err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setFormData({ ...formData, avatar_url: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${accentColor}`}>
            Configurações do Perfil
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={24} className="text-gray-500" />
            </button>
          )}
        </div>

        {/* Avatar Preview */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            {formData.avatar_url ? (
              <img
                src={formData.avatar_url}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-lg bg-slate-500">
                <User size={40} className="text-white" />
              </div>
            )}

            <label
              className={`absolute bottom-0 right-0 ${buttonBg} text-white p-2 rounded-full cursor-pointer hover:opacity-90`}
            >
              <Upload size={16} />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <Upload size={14} />
              {uploading ? "Enviando..." : "Alterar foto"}
            </button>
            {formData.avatar_url && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-sm text-red-500 hover:underline"
              >
                Remover
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              placeholder="Seu nome"
              maxLength={100}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
            />
          </div>

          {/* Tema do App */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Palette size={16} />
              Tema do App
            </label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, app_theme: theme.id })
                  }
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.app_theme === theme.id
                      ? "border-gray-800 ring-2 ring-gray-400"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div className="flex gap-1 justify-center mb-2">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: theme.secondary }}
                    />
                  </div>
                  <span className="text-xs font-medium">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mensagem */}
          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Botão salvar */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${buttonBg} text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {isLoading ? (
              "Salvando..."
            ) : (
              <>
                <Save size={20} />
                Salvar Alterações
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
