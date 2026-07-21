"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Layers } from "lucide-react";
import { Loader } from "@/components/motion/loader";

const formatCpfCnpj = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  } else {
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  }
};

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpfCnpj(formatCpfCnpj(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        cpfCnpj,
        password,
      });

      if (res?.error) {
        setError("Credenciais inválidas. Verifique seu documento e senha.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Ocorreu um erro ao tentar fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 md:p-8 font-sans">
      <div className="w-full max-w-[900px] bg-[#1c1c1e] rounded-3xl shadow-2xl flex overflow-hidden border border-zinc-800/50">
        
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">

          <div className="max-w-[320px] w-full mx-auto mt-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-100 mb-8">Entrar</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="cpfCnpj" className="text-xs font-medium text-zinc-400">
                  Seu CPF ou CNPJ
                </Label>
                <Input
                  id="cpfCnpj"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpfCnpj}
                  onChange={handleCpfCnpjChange}
                  maxLength={18}
                  required
                  className="h-11 bg-[#141415] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-medium text-zinc-400">
                    Senha
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 bg-[#141415] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 rounded-lg text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-b from-zinc-600 to-zinc-700 hover:from-zinc-500 hover:to-zinc-600 text-white font-medium h-11 rounded-lg border border-zinc-600/50 shadow-inner mt-4 transition-all"
              >
                {loading ? <Loader variant="metaballs" className="text-white"/> : "Entrar"}
              </Button>
            </form>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="hidden lg:flex w-1/2 p-2">
          <div className="w-full h-full bg-[#050505] rounded-[20px] relative overflow-hidden flex flex-col items-center justify-center border border-white/[0.02]">
            
            {/* Minimalist Starfield */}
            <div className="absolute inset-0">
              <div className="absolute top-[15%] left-[20%] w-[2px] h-[2px] bg-white/40 rounded-full"></div>
              <div className="absolute top-[45%] left-[10%] w-[2px] h-[2px] bg-white/30 rounded-full"></div>
              <div className="absolute top-[25%] right-[25%] w-[1.5px] h-[1.5px] bg-white/50 rounded-full"></div>
              <div className="absolute bottom-[35%] left-[30%] w-[1.5px] h-[1.5px] bg-white/20 rounded-full"></div>
              <div className="absolute bottom-[20%] right-[15%] w-[2px] h-[2px] bg-white/40 rounded-full"></div>
              <div className="absolute top-[60%] right-[35%] w-[1px] h-[1px] bg-white/30 rounded-full"></div>
            </div>

            {/* Shooting Star Top Left */}
            <div className="absolute top-[20%] left-[25%] z-10">
              <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]"></div>
              <div className="w-[1px] h-[120px] bg-gradient-to-b from-white/80 via-white/20 to-transparent mx-auto"></div>
            </div>

            {/* Shooting Star Bottom Right */}
            <div className="absolute bottom-[20%] right-[25%] z-10 rotate-180">
              <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]"></div>
              <div className="w-[1px] h-[160px] bg-gradient-to-b from-white/80 via-white/20 to-transparent mx-auto"></div>
            </div>

            {/* Main Planet */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-slate-300 via-blue-200 to-white shadow-[0_0_50px_rgba(219,234,254,0.15)] relative z-10 overflow-hidden flex items-center justify-center">
              {/* Inner shadow to give 3D sphere effect */}
              <div className="absolute inset-0 rounded-full shadow-[inset_-12px_-12px_24px_rgba(0,0,0,0.7)]"></div>
              {/* Subtle texture/glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent opacity-60"></div>
            </div>

            {/* Small Moon */}
            <div className="absolute top-[30%] right-[20%] w-6 h-6 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden">
              <div className="absolute inset-0 rounded-full shadow-[inset_-3px_-3px_6px_rgba(0,0,0,0.6)]"></div>
            </div>

            {/* Logo */}
            <div className="absolute bottom-10 flex items-center gap-2 z-10">
              <span className="text-white font-bold tracking-[0.2em] text-sm lowercase">Nexus Connect</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
