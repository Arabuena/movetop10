import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { 
  UserCircleIcon,
  PhoneIcon,
  StarIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { toast } from 'react-hot-toast';

const PassengerProfile = () => {
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  useEffect(() => {
    if (!socket) return;

    socket.emit('passenger:getStats', {}, (response) => {
      if (response.success) {
        setStats(response.stats);
      }
    });
  }, [socket]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await updateUser(formData);
      if (response.success) {
        toast.success('Perfil atualizado com sucesso!');
        setIsEditing(false);
      } else {
        toast.error('Erro ao atualizar perfil');
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Cabeçalho do perfil */}
        <div className="p-6 sm:p-8 bg-99-primary">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-16 w-16 text-gray-400" />
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <p className="text-99-gray-100">Passageiro desde {new Date(user?.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">Total de Corridas</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.totalRides}</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">Avaliação Média</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <span className="text-3xl font-semibold text-gray-900">{stats.rating.toFixed(1)}</span>
                <StarIcon className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">Km Percorridos</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{Math.round(stats.totalDistance / 1000)} km</p>
            </div>
          </div>
        )}

        {/* Formulário de edição */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                {isEditing ? (
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{user?.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                {isEditing ? (
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{user?.email || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <div className="mt-1 flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-900">{user?.phone}</span>
                </div>
              </div>

              {isEditing ? (
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    loading={loading}
                    className="flex-1"
                  >
                    Salvar Alterações
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Editar Perfil
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PassengerProfile; 