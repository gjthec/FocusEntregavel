import React, { useState, useEffect } from "react";
import { DataService } from "../services/dataService";
import { AuthService } from "../services/authService";
import { User, PlanTier, UserRole } from "../types";
import {
  Search,
  Edit,
  Check,
  ShieldAlert,
  UserPlus,
  Mail,
  User as UserIcon,
  Trash2,
  X,
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<PlanTier>(PlanTier.BASIC);
  const [editRole, setEditRole] = useState<UserRole>(UserRole.USER);
  const currentUser = AuthService.getCurrentUser();

  // Create User State
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPlan, setNewUserPlan] = useState<PlanTier>(PlanTier.BASIC);
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.USER);
  const [createStatus, setCreateStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await DataService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    // Note: Creating users with specific roles/plans directly via client-side Auth.signUp
    // requires trigger logic in Supabase or an Edge Function for security.
    // This implementation assumes a trigger handles profile creation or falls back to public insert.
    try {
      // Warning: This only registers auth. Logic for creating Profile with Plan/Role is in AuthService.register fallback
      await AuthService.register(
        newUserEmail,
        "123456",
        newUserName,
        newUserRole,
        newUserPlan
      );

      setCreateStatus({
        type: "success",
        msg: "Usuário criado (Senha padrão: 123456)",
      });
      setNewUserEmail("");
      setNewUserName("");
      setNewUserPlan(PlanTier.BASIC);
      setNewUserRole(UserRole.USER);
      loadUsers();
      setTimeout(() => setCreateStatus(null), 3000);
    } catch (err: any) {
      setCreateStatus({
        type: "error",
        msg: err.message || "Erro ao criar usuário",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      window.confirm(
        "Tem certeza? Apenas o perfil será removido nesta demo (Auth requer admin API)."
      )
    ) {
      try {
        await DataService.deleteUser(userId);
        setUsers(users.filter((u) => u.id !== userId));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditPlan(user.plan);
    setEditRole(user.role);
  };

  const saveEdit = async (userId: string) => {
    try {
      await DataService.updateUserPlanAndRole(userId, editPlan, editRole);
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, plan: editPlan, role: editRole } : u
        )
      );
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar plano");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PlanBadge = ({ plan }: { plan: PlanTier }) => {
    const colors = {
      [PlanTier.BASIC]:
        "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
      [PlanTier.PRO]:
        "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
      [PlanTier.PREMIUM]:
        "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-bold ${colors[plan]}`}
      >
        {plan.toUpperCase()}
      </span>
    );
  };

  const RoleBadge = ({ role }: { role: UserRole }) => {
    const colors = {
      [UserRole.ADMIN]:
        "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
      [UserRole.USER]:
        "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${colors[role]}`}
      >
        {role}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldAlert className="text-blue-600" />
            Painel Administrativo
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Gerenciar usuários e assinaturas.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2 w-full md:w-64 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <Search size={20} className="text-slate-400" />
          <input
            type="text"
            placeholder="Buscar usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Add User Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-blue-600" /> Adicionar Novo
          Usuário
        </h2>
        <form
          onSubmit={handleCreateUser}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
        >
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Nome
            </label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2">
              <UserIcon size={16} className="text-slate-400" />
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Nome completo"
                className="bg-transparent w-full outline-none text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              E-mail
            </label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2">
              <Mail size={16} className="text-slate-400" />
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="bg-transparent w-full outline-none text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Plano
            </label>
            <select
              value={newUserPlan}
              onChange={(e) => setNewUserPlan(e.target.value as PlanTier)}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none text-slate-900 dark:text-white"
            >
              <option value={PlanTier.BASIC}>Basic</option>
              <option value={PlanTier.PRO}>Pro</option>
              <option value={PlanTier.PREMIUM}>Premium</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Função
            </label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as UserRole)}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none text-slate-900 dark:text-white"
            >
              <option value={UserRole.USER}>Usuário</option>
              <option value={UserRole.ADMIN}>Administrador</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors"
            >
              Criar Usuário
            </button>
          </div>
        </form>
        {createStatus && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm font-medium text-center ${
              createStatus.type === "success"
                ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
            }`}
          >
            {createStatus.msg}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">
                  Usuário
                </th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">
                  E-mail
                </th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">
                  Função
                </th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">
                  Data de Entrada
                </th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">
                  Plano Atual
                </th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-sm text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredUsers.map((user) => {
                const isCurrentUser = currentUser?.id === user.id;
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="p-4 font-medium text-slate-800 dark:text-white flex items-center gap-2">
                      {user.role === UserRole.ADMIN && (
                        <ShieldAlert size={14} className="text-blue-600" />
                      )}
                      {user.name}{" "}
                      {isCurrentUser && (
                        <span className="text-xs text-slate-400 font-normal">
                          (Você)
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {user.email}
                    </td>
                    <td className="p-4">
                      {editingId === user.id ? (
                        <select
                          value={editRole}
                          onChange={(e) =>
                            setEditRole(e.target.value as UserRole)
                          }
                          className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                        >
                          <option value={UserRole.USER}>Usuário</option>
                          <option value={UserRole.ADMIN}>Administrador</option>
                        </select>
                      ) : (
                        <RoleBadge role={user.role} />
                      )}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">
                      {new Date(user.joinedDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {editingId === user.id ? (
                        <select
                          value={editPlan}
                          onChange={(e) =>
                            setEditPlan(e.target.value as PlanTier)
                          }
                          className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                        >
                          <option value={PlanTier.BASIC}>Basic</option>
                          <option value={PlanTier.PRO}>Pro</option>
                          <option value={PlanTier.PREMIUM}>Premium</option>
                        </select>
                      ) : (
                        <PlanBadge plan={user.plan} />
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {!isCurrentUser && (
                        <div className="flex justify-end gap-2">
                          {editingId === user.id ? (
                            <>
                              <button
                                onClick={() => saveEdit(user.id)}
                                className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800"
                                title="Salvar"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                                title="Cancelar"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(user)}
                                className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="Editar Plano e Função"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Excluir Usuário"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            Nenhum usuário encontrado.
          </div>
        )}
      </div>
    </div>
  );
};
