import React, { useState } from 'react';
import QRCode from 'react-qr-code';

const ShareRide = ({ ride, onClose }) => {
  const [shareMethod, setShareMethod] = useState('link'); // 'link' ou 'qrcode'
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/track/${ride._id}`;
  const shareMessage = `Acompanhe minha corrida em tempo real:\n${shareUrl}\n\nMotorista: ${ride.driver?.name}\nVeículo: ${ride.vehicle?.model} - ${ride.vehicle?.plate}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar link:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Acompanhe minha corrida',
          text: shareMessage,
          url: shareUrl
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Erro ao compartilhar:', error);
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Cabeçalho */}
      <div className="bg-yellow-400 p-4 flex items-center">
        <button onClick={onClose} className="mr-3">
          <span className="material-icons-outlined">close</span>
        </button>
        <h3 className="font-medium">Compartilhar corrida</h3>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            onClick={() => setShareMethod('link')}
            className={`flex-1 py-2 text-center ${
              shareMethod === 'link'
                ? 'border-b-2 border-yellow-400 text-yellow-600'
                : 'text-gray-500'
            }`}
          >
            Link
          </button>
          <button
            onClick={() => setShareMethod('qrcode')}
            className={`flex-1 py-2 text-center ${
              shareMethod === 'qrcode'
                ? 'border-b-2 border-yellow-400 text-yellow-600'
                : 'text-gray-500'
            }`}
          >
            QR Code
          </button>
        </div>

        {/* Link de compartilhamento */}
        {shareMethod === 'link' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500"
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            {navigator.share && (
              <button
                onClick={handleShare}
                className="w-full py-3 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 flex items-center justify-center space-x-2"
              >
                <span className="material-icons-outlined">share</span>
                <span>Compartilhar</span>
              </button>
            )}
          </div>
        )}

        {/* QR Code */}
        {shareMethod === 'qrcode' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-inner">
              <QRCode value={shareUrl} size={200} />
            </div>
            <p className="text-sm text-gray-500 text-center">
              Escaneie o QR Code para acompanhar a corrida
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareRide; 