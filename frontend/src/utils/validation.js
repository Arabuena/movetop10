import * as yup from 'yup';

export const phoneRegex = /^\d{11}$/;
export const cpfRegex = /^\d{11}$/;
export const cnhRegex = /^\d{11}$/;
export const plateRegex = /^[A-Z]{3}\d{4}$/;

export const loginSchema = yup.object().shape({
  phone: yup
    .string()
    .matches(phoneRegex, 'Número de celular inválido')
    .required('Número de celular é obrigatório')
});

export const passengerRegisterSchema = yup.object().shape({
  name: yup
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .required('Nome é obrigatório'),
  phone: yup
    .string()
    .matches(phoneRegex, 'Número de celular inválido')
    .required('Número de celular é obrigatório'),
  email: yup
    .string()
    .email('E-mail inválido')
    .required('E-mail é obrigatório'),
  cpf: yup
    .string()
    .matches(cpfRegex, 'CPF inválido')
    .required('CPF é obrigatório')
});

export const driverRegisterSchema = yup.object().shape({
  name: yup
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .required('Nome é obrigatório'),
  phone: yup
    .string()
    .matches(phoneRegex, 'Número de celular inválido')
    .required('Número de celular é obrigatório'),
  email: yup
    .string()
    .email('E-mail inválido')
    .required('E-mail é obrigatório'),
  cpf: yup
    .string()
    .matches(cpfRegex, 'CPF inválido')
    .required('CPF é obrigatório'),
  cnh: yup
    .string()
    .matches(cnhRegex, 'CNH inválida')
    .required('CNH é obrigatória'),
  vehicle: yup.object().shape({
    model: yup
      .string()
      .required('Modelo do veículo é obrigatório'),
    plate: yup
      .string()
      .matches(plateRegex, 'Placa inválida')
      .required('Placa é obrigatória'),
    year: yup
      .number()
      .min(2010, 'Ano deve ser maior que 2010')
      .max(new Date().getFullYear(), 'Ano não pode ser maior que o atual')
      .required('Ano é obrigatório'),
    color: yup
      .string()
      .required('Cor é obrigatória')
  })
}); 