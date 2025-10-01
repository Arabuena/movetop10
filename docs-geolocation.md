# Documentação da Solução de Geolocalização

## Visão Geral

Esta documentação descreve a solução implementada para tratar erros de geolocalização no aplicativo MoveTop10. A solução fornece uma experiência de usuário melhorada quando ocorrem problemas com a permissão de localização ou quando o GPS não está disponível.

## Componentes Principais

### 1. Hook useLocation

O hook `useLocation.js` foi aprimorado para:
- Detectar e tratar erros de geolocalização
- Fornecer uma localização padrão (Goiânia) quando necessário
- Verificar e solicitar permissões de localização
- Informar ao usuário sobre o status da localização

```javascript
// Trecho do hook useLocation.js
const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [isDefaultLocation, setIsDefaultLocation] = useState(false);
  
  // Função para definir uma localização padrão em caso de erro
  const fallbackLocation = () => {
    // Coordenadas de Goiânia como localização padrão
    const defaultLocation = {
      latitude: -16.6869,
      longitude: -49.2648,
      accuracy: 1000 // Precisão baixa para indicar que é uma localização aproximada
    };
    setLocation(defaultLocation);
    setIsDefaultLocation(true);
    return defaultLocation;
  };
  
  // Resto da implementação...
};
```

### 2. Componente LocationError

Um novo componente `LocationError.js` foi criado para:
- Exibir mensagens de erro amigáveis
- Oferecer opções para o usuário resolver o problema
- Permitir continuar com uma localização aproximada

```javascript
// Trecho do componente LocationError.js
const LocationError = ({ error, permissionStatus, requestPermission, onContinueWithDefault }) => {
  return (
    <div className="location-error-container">
      <div className="location-error-content">
        <h2>Problema de Localização</h2>
        <p>Permissão de localização negada. Por favor, habilite nas configurações do navegador.</p>
        
        <div className="location-error-actions">
          <button onClick={requestPermission}>
            Permitir Acesso à Localização
          </button>
          <button onClick={onContinueWithDefault}>
            Continuar com Localização Aproximada
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 3. Integração nos Componentes

Os componentes que utilizam geolocalização foram atualizados para usar o hook melhorado e exibir o componente de erro quando necessário:

- `Home.js` (passageiro)
- `SelectDestination.js` (passageiro)

## Fluxo de Funcionamento

1. O aplicativo tenta obter a localização do usuário
2. Se houver um erro (permissão negada, GPS desativado, etc.):
   - O erro é capturado e registrado
   - O componente `LocationError` é exibido
   - O usuário pode escolher permitir acesso ou usar localização aproximada
3. Se o usuário optar por usar a localização aproximada:
   - Uma localização padrão (Goiânia) é usada
   - O aplicativo continua funcionando normalmente
   - Uma indicação visual mostra que a localização é aproximada

## Benefícios

- Melhor experiência do usuário em caso de erros
- Prevenção de travamentos do aplicativo
- Opção de fallback para continuar usando o aplicativo
- Mensagens claras sobre o status da localização

## Considerações Futuras

- Implementar cache da última localização conhecida
- Adicionar mais opções de localização padrão baseadas na região do usuário
- Melhorar a precisão da localização aproximada com base em outros dados disponíveis