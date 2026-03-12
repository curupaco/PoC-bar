import { FORBIDDEN_WORDS, KEYBOARD_SEQUENCES, REPETITIVE_NUMBERS } from './forbiddenWords';

/**
 * Normaliza uma string removendo acentos e convertendo caracteres comuns 
 * (ex: @ vira A, 0 vira O) para facilitar a comparação com palavras proibidas.
 */
function normalizeString(str: string): string {
    return str
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/@/g, 'A')
        .replace(/0/g, 'O')
        .replace(/1/g, 'I')
        .replace(/3/g, 'E')
        .replace(/\$/g, 'S')
        .trim();
}

/**
 * Valida se um nome (de usuário, mesa ou produto) atende às diretrizes do sistema.
 * @returns Retorna uma string com a mensagem de erro se inválido, ou null se válido.
 */
export function validateItemName(name: string): string | null {
    if (!name || name.trim().length === 0) {
        return "O nome não pode estar vazio.";
    }

    const cleanName = name.trim();
    const normalized = normalizeString(cleanName);

    // 1. Regra de caracteres isolados (Ponto, Vírgula, Hífen)
    if (['.', ',', '-'].includes(cleanName)) {
        return "Sinais de pontuação não podem ser usados como nomes isolados.";
    }

    // 2. Comprimento (muito curto ou muito longo)
    // Mesas podem ter nomes curtos (ex: "A1"), mas nomes de produtos/usuários geralmente não.
    // Vamos barrar nomes com apenas 1 ou 2 caracteres que não sejam apenas números.
    const isOnlyNumbers = /^\d+$/.test(normalized);
    if (normalized.length < 3 && !isOnlyNumbers) {
        return "O nome é muito curto. Use pelo menos 3 caracteres.";
    }

    if (normalized.length > 50) {
        return "O nome é muito longo. Use no máximo 50 caracteres.";
    }

    // 3. Repetições de 3 letras iguais (AAA, BBB, etc.)
    if (/(.)\1\1/.test(normalized)) {
        // Exceção para números se forem apenas 3 dígitos (ex: "111") - embora o usuário tenha pedido para proibir alguns específicos
        // Vamos checar números repetidos na lista específica REPETITIVE_NUMBERS
        const isRepetitiveLetter = /[A-Z]/.test(normalized.match(/(.)\1\1/)![0]);
        if (isRepetitiveLetter) {
            return "Repetição excessiva de letras não é permitida.";
        }
    }

    // 4. Sequências de números repetidos ou específicos (000, 111, 123, 999)
    for (const seq of REPETITIVE_NUMBERS) {
        if (normalized.includes(seq)) {
            return `A sequência "${seq}" não é permitida.`;
        }
    }
    if (normalized.includes('123')) {
        return 'A sequência "123" não é permitida.';
    }

    // 5. Sequências de teclado (ASDF, QWERTY)
    for (const seq of KEYBOARD_SEQUENCES) {
        if (normalized.includes(seq)) {
            return "O nome contém uma sequência de teclado proibida.";
        }
    }

    // 6. Palavras proibidas (Check individual words and partial matches)
    const words = normalized.split(/\s+/);
    
    for (const forbidden of FORBIDDEN_WORDS) {
        // Checa se a palavra PROIBIDA está contida no nome ou se é uma das palavras do nome
        // Ex: Se proibido for "TESTE", barramos "TESTE", "TESTANDO", "MEUTESTE"
        if (normalized === forbidden || words.includes(forbidden)) {
            return `A palavra "${forbidden}" não é permitida.`;
        }
        
        // Regra específica para palavras muito genéricas que não podem NEM aparecer (ex: "OUTR")
        if (forbidden.length <= 4 && normalized.includes(forbidden)) {
             // Apenas barramos se for exatamente a palavra ou se tiver espaço em volta para evitar falsos positivos
             // mas como o usuário pediu "OUTR" e "DIV", vamos ser mais restritos.
             const regex = new RegExp(`\\b${forbidden}\\b`, 'i');
             if (regex.test(normalized)) {
                 return `O termo "${forbidden}" é muito genérico.`;
             }
        }
    }

    return null;
}
