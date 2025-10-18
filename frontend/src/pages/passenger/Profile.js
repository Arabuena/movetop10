import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { 
  UserCircleIcon,
  PhoneIcon,
  StarIcon,
  PencilIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import MaskedInput from '../../components/common/MaskedInput';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const PassengerProfile = () => {
  const { user, updateUser, uploadAvatar } = useAuth();
  const { socket } = useSocket();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [errors, setErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  // Garantir URL absoluta do avatar
  const resolveAvatarUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url; // preview base64
    if (/^https?:\/\//i.test(url)) return url; // já absoluto
    const base = (api?.defaults?.baseURL || '').replace(/\/api$/, '') || (process.env.REACT_APP_API_URL || 'http://localhost:5000');
    const resolved = `${base}${url.startsWith('/') ? '' : '/'}${url}`;
    console.debug('[Profile] resolveAvatarUrl', { input: url, base, resolved });
    return resolved;
  };

  // Adicionar cache-buster para evitar imagem antiga em cache
  const withCacheBust = (url) => {
    if (!url) return url;
    const sep = url.includes('?') ? '&' : '?';
    const busted = `${url}${sep}t=${Date.now()}`;
    console.debug('[Profile] withCacheBust', { input: url, busted });
    return busted;
  };

  // Inicializar preview com avatar atual do usuário
  useEffect(() => {
    if (user?.avatarUrl && !avatarPreview) {
      const resolved = resolveAvatarUrl(user.avatarUrl);
      const busted = withCacheBust(resolved);
      console.debug('[Profile] Init avatarPreview from user.avatarUrl', { avatarUrl: user.avatarUrl, resolved, busted });
      setAvatarPreview(busted);
    }
  }, [user?.avatarUrl]);

  // Buscar estatísticas do passageiro (restaurado)
  useEffect(() => {
    if (!socket) return;
    socket.emit('passenger:getStats', {}, (response) => {
      if (response.success) {
        setStats(response.stats);
      }
    });
  }, [socket]);

  // Handlers e validação (restaurados)
  const handleChange = (e) => {
    const { name } = e.target;
    const value = e.target.rawValue ?? e.target.value;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validate = () => {
    const nextErrors = {};
    const name = (formData.name || '').trim();
    const email = (formData.email || '').trim();
    const phone = (formData.phone || '').replace(/\D/g, '');

    if (!name || name.length < 2) {
      nextErrors.name = 'Informe um nome válido';
    }
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        nextErrors.email = 'Email inválido';
      }
    }
    if (isEditing && formData.phone !== (user?.phone || '')) {
      if (phone.length !== 11) {
        nextErrors.phone = 'Telefone deve conter 11 dígitos';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const isDirty = (
    (formData.name || '') !== (user?.name || '') ||
    (formData.email || '') !== (user?.email || '') ||
    (formData.phone || '') !== (user?.phone || '')
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isDirty) {
      toast('Nenhuma alteração para salvar');
      return;
    }
    if (!validate()) return;
    setLoading(true);

    try {
      const updates = {};
      if ((formData.name || '') !== (user?.name || '')) updates.name = formData.name.trim();
      if ((formData.email || '') !== (user?.email || '')) updates.email = formData.email.trim();
      if ((formData.phone || '') !== (user?.phone || '')) updates.phone = formData.phone.replace(/\D/g, '');

      const response = await updateUser(updates);
      if (response.success) {
        toast.success('Perfil atualizado com sucesso!');
        setIsEditing(false);
        setErrors({});
        setFormData({
          name: response.user?.name || '',
          email: response.user?.email || '',
          phone: response.user?.phone || ''
        });
      } else {
        toast.error(response.error || 'Erro ao atualizar perfil');
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
            <div className="relative h-20 w-20 rounded-full overflow-hidden bg-white flex items-center justify-center">
              {avatarPreview || user?.avatarUrl ? (
                <img
                  key={avatarPreview ? avatarPreview : resolveAvatarUrl(user?.avatarUrl) || 'avatar-key'}
                  src={avatarPreview ? avatarPreview : resolveAvatarUrl(user?.avatarUrl)}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                  onLoad={() => console.debug('[Profile] <img> loaded', { src: avatarPreview || resolveAvatarUrl(user?.avatarUrl) })}
                  onError={(e) => {
                    console.warn('[Profile] <img> error', { src: e?.currentTarget?.src });
                    // Falha ao carregar: limpar preview e deixar ícone padrão
                    setAvatarPreview(null);
                  }}
                />
              ) : (
                <UserCircleIcon className="h-16 w-16 text-gray-400" />
              )}
              <label className="absolute bottom-0 right-0 h-8 w-8 bg-black/50 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/60">
                <CameraIcon className="h-4 w-4 text-white" />
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    console.debug('[Profile] file selected', { name: file.name, type: file.type, size: file.size });
                    // Preview
                    const reader = new FileReader();
                    reader.onload = () => {
                      console.debug('[Profile] FileReader onload');
                      setAvatarPreview(reader.result);
                    };
                    reader.onerror = (err) => console.warn('[Profile] FileReader error', err);
                    reader.readAsDataURL(file);
                    // Upload
                    setUploadingAvatar(true);
                    const result = await uploadAvatar(file);
                    setUploadingAvatar(false);
                    if (result.success) {
                      toast.success('Foto atualizada com sucesso');
                      // Garantir exibição imediata com a URL retornada + cache-buster
                      const resolved = resolveAvatarUrl(result.user?.avatarUrl);
                      const busted = withCacheBust(resolved);
                      console.debug('[Profile] uploadAvatar success', { avatarUrl: result.user?.avatarUrl, resolved, busted });
                      setAvatarPreview(busted);
                    } else {
                      console.warn('[Profile] uploadAvatar failed', result.error);
                      toast.error(result.error || 'Falha ao enviar foto');
                    }
                  }}
                />
              </label>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="text-white text-xs">Enviando...</span>
                </div>
              )}
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
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
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
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                {isEditing ? (
                  <div className="mt-1">
                    <MaskedInput
                      name="phone"
                      mask="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-move-primary focus:border-move-primary"
                    />
                    <p className="mt-1 text-xs text-gray-500">Ao alterar o telefone, use o novo número para login.</p>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-900">{user?.phone}</span>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading || !isDirty || Object.keys(errors).length > 0}
                    className="flex-1"
                  >
                    Salvar Alterações
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setErrors({});
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        phone: user?.phone || ''
                      });
                    }}
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