import React from 'react';
import { PatternFormat } from 'react-number-format';

const MaskedInput = React.forwardRef(({ mask, format, className = '', onChange, ...props }, ref) => {
  const defaultClassName = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-move-primary focus:border-move-primary';

  const handleValueChange = (values) => {
    if (onChange) {
      // Garantir que o telefone sempre tenha 11 dígitos (com o 9)
      let rawValue = values.value.replace(/\D/g, '');
      if (mask === 'phone' && rawValue.length === 10) {
        // Adicionar o 9 depois do DDD se não existir
        rawValue = rawValue.slice(0, 2) + '9' + rawValue.slice(2);
      }

      const syntheticEvent = {
        target: {
          name: props.name,
          value: values.value,
          rawValue
        }
      };
      onChange(syntheticEvent);
    }
  };

  // Definir o formato baseado no tipo de máscara
  const getFormat = () => {
    if (format) return format;
    switch (mask) {
      case 'phone':
        return '(##) #####-####'; // Formato para 11 dígitos
      case 'cpf':
        return '###.###.###-##';
      case 'cnh':
        return '###########';
      default:
        return mask || '##########';
    }
  };

  return (
    <PatternFormat
      format={getFormat()}
      mask="_"
      allowEmptyFormatting={false}
      onValueChange={handleValueChange}
      {...props}
      getInputRef={ref}
      className={`${defaultClassName} ${className}`}
    />
  );
});

MaskedInput.displayName = 'MaskedInput';

export default React.memo(MaskedInput); 