// app/api/contracts/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RPCProvider } from '@/utils/rpc';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    if (!address) {
      return NextResponse.json({ error: 'Se requiere parámetro address' }, { status: 400 });
    }

    const provider = new RPCProvider('http://127.0.0.1:8545');
    
    console.log(`🔍 Analizando contrato: ${address}`);
    
    const [code, balance, transactionCount, storage0, storage1] = await Promise.all([
      provider.getCode(address),
      provider.getBalance(address),
      provider.getTransactionCount(address),
      provider.getStorageAt(address, '0x0').catch(() => '0x0'),
      provider.getStorageAt(address, '0x1').catch(() => '0x0')
    ]);

    const isContract = code && code !== '0x' && code !== '0x0';
    
    if (!isContract) {
      return NextResponse.json({
        address: address,
        is_contract: false,
        message: 'No es un contrato o no tiene código'
      });
    }

    // Análisis completo del bytecode
    const analysis = analyzeBytecode(code);
    
    return NextResponse.json({
      address: address,
      is_contract: true,
      basic_info: {
        code_size_bytes: (code.length - 2) / 2,
        balance: balance,
        balance_eth: (parseInt(balance, 16) / 1e18).toString(),
        transaction_count: parseInt(transactionCount, 16),
        storage_slot_0: storage0,
        storage_slot_1: storage1
      },
      bytecode_analysis: analysis,
      raw_bytecode: {
        preview: code.substring(0, 200) + '...',
        full_length: code.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function analyzeBytecode(bytecode: string) {
  // Remover el prefijo 0x
  const cleanBytecode = bytecode.startsWith('0x') ? bytecode.substring(2) : bytecode;
  
  const analysis = {
    metadata: extractMetadata(cleanBytecode),
    selectors: extractFunctionSelectors(cleanBytecode),
    standards: detectStandards(cleanBytecode),
    opcodes: analyzeOpcodes(cleanBytecode),
    patterns: findCommonPatterns(cleanBytecode),
    constructor: analyzeConstructor(cleanBytecode)
  };

  return analysis;
}

function extractMetadata(bytecode: string) {
  // Buscar metadata de Solidity (IPFS hash, etc.)
  const metadataStart = bytecode.lastIndexOf('a264697066735822');
  const metadataEnd = bytecode.lastIndexOf('64736f6c6343');
  
  let metadata = null;
  if (metadataStart !== -1 && metadataEnd !== -1) {
    const metadataContent = bytecode.substring(metadataStart, metadataEnd + 12);
    metadata = {
      position: metadataStart,
      length: metadataContent.length,
      content: metadataContent.substring(0, 100) + '...',
      has_metadata: true
    };
  } else {
    metadata = { has_metadata: false };
  }

  return metadata;
}

function extractFunctionSelectors(bytecode: string) {
  const selectors: any[] = [];
  
  // Buscar patrones de selectores de función (PUSH4 + selector)
  for (let i = 0; i < bytecode.length - 11; i += 2) {
    const opcode = bytecode.substring(i, i + 2);
    
    // PUSH4 opcode (63-64)
    if (opcode === '63' || opcode === '64') {
      const potentialSelector = bytecode.substring(i + 2, i + 10);
      
      // Verificar que sea un selector válido (8 caracteres hex)
      if (/^[0-9a-fA-F]{8}$/.test(potentialSelector)) {
        const functionName = getFunctionName(potentialSelector);
        
        selectors.push({
          selector: '0x' + potentialSelector,
          position: i,
          function_name: functionName,
          signature: getFunctionSignature(potentialSelector)
        });
      }
    }
  }

  // Eliminar duplicados
  const uniqueSelectors = selectors.filter((selector, index, self) =>
    index === self.findIndex(s => s.selector === selector.selector)
  );

  return uniqueSelectors.slice(0, 20); // Máximo 20 selectores
}

function getFunctionName(selector: string): string {
  const commonFunctions: { [key: string]: string } = {
    '06fdde03': 'name()',
    '95d89b41': 'symbol()',
    '313ce567': 'decimals()',
    '70a08231': 'balanceOf(address)',
    '18160ddd': 'totalSupply()',
    'a9059cbb': 'transfer(address,uint256)',
    '23b872dd': 'transferFrom(address,address,uint256)',
    '095ea7b3': 'approve(address,uint256)',
    'dd62ed3e': 'allowance(address,address)',
    '6352211e': 'ownerOf(uint256)',
    '42842e0e': 'safeTransferFrom(address,address,uint256)',
    'b88d4fde': 'safeTransferFrom(address,address,uint256,bytes)',
    '42966c68': 'burn(uint256)',
    'a0712d68': 'mint(address,uint256)',
    '40c10f19': 'mint(address,uint256)',
    '8da5cb5b': 'owner()',
    'a6f9dae1': 'transferOwnership(address)',
    'f2fde38b': 'transferOwnership(address)',
    '8456cb59': 'pause()',
    '3f4ba83a': 'unpause()',
    '5c975abb': 'paused()',
    '01ffc9a7': 'supportsInterface(bytes4)'
  };

  return commonFunctions[selector.toLowerCase()] || `unknown_${selector}`;
}

function getFunctionSignature(selector: string): string {
  // Esto es una aproximación - en la realidad necesitarías la ABI completa
  const commonSignatures: { [key: string]: string } = {
    '70a08231': 'function balanceOf(address owner) view returns (uint256)',
    'a9059cbb': 'function transfer(address to, uint256 amount) returns (bool)',
    '23b872dd': 'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    '095ea7b3': 'function approve(address spender, uint256 amount) returns (bool)',
    'dd62ed3e': 'function allowance(address owner, address spender) view returns (uint256)',
    '18160ddd': 'function totalSupply() view returns (uint256)',
    '6352211e': 'function ownerOf(uint256 tokenId) view returns (address)',
    '42842e0e': 'function safeTransferFrom(address from, address to, uint256 tokenId)',
    '8da5cb5b': 'function owner() view returns (address)'
  };

  return commonSignatures[selector.toLowerCase()] || 'function unknown()';
}

function detectStandards(bytecode: string) {
  const standards = {
    erc20: false,
    erc721: false,
    erc1155: false,
    ownable: false,
    pausable: false,
    burnable: false,
    mintable: false
  };

  // ERC20
  const erc20Selectors = ['70a08231', 'a9059cbb', 'dd62ed3e'];
  standards.erc20 = erc20Selectors.every(selector => bytecode.includes(selector));

  // ERC721
  const erc721Selectors = ['6352211e', '42842e0e'];
  standards.erc721 = erc721Selectors.every(selector => bytecode.includes(selector));

  // ERC1155
  const erc1155Selectors = ['f242432a', '2eb2c2d6'];
  standards.erc1155 = erc1155Selectors.some(selector => bytecode.includes(selector));

  // Ownable
  standards.ownable = bytecode.includes('8da5cb5b');

  // Pausable
  standards.pausable = bytecode.includes('8456cb59') || bytecode.includes('5c975abb');

  // Burnable
  standards.burnable = bytecode.includes('42966c68');

  // Mintable
  standards.mintable = bytecode.includes('a0712d68') || bytecode.includes('40c10f19');

  return standards;
}

function analyzeOpcodes(bytecode: string) {
  const opcodeStats: { [key: string]: number } = {};
  const commonOpcodes = [
    '60', '61', '62', '63', '64', // PUSH1-32
    '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '8a', '8b', '8c', '8d', '8e', '8f', // DUP1-16
    '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '9a', '9b', '9c', '9d', '9e', '9f', // SWAP1-16
    '51', '52', '53', '54', '55', '56', '57', '58', '59', // MSTORE, SLOAD, etc.
    'f3', 'fd', 'fe', 'ff' // RETURN, REVERT, INVALID, SELFDESTRUCT
  ];

  for (let i = 0; i < bytecode.length; i += 2) {
    const opcode = bytecode.substring(i, i + 2);
    opcodeStats[opcode] = (opcodeStats[opcode] || 0) + 1;
  }

  const totalOpcodes = Object.values(opcodeStats).reduce((sum, count) => sum + count, 0);
  
  return {
    total_opcodes: totalOpcodes,
    unique_opcodes: Object.keys(opcodeStats).length,
    most_common: Object.entries(opcodeStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([opcode, count]) => ({ opcode, count, percentage: ((count as number) / totalOpcodes * 100).toFixed(2) + '%' })),
    has_constructor: bytecode.includes('f3'), // RETURN opcode
    has_revert: bytecode.includes('fd') // REVERT opcode
  };
}

function findCommonPatterns(bytecode: string) {
  const patterns = {
    function_dispatchers: 0,
    storage_access: 0,
    external_calls: 0,
    math_operations: 0,
    control_flow: 0
  };

  // Buscar patrones específicos
  patterns.function_dispatchers = (bytecode.match(/63[0-9a-f]{8}/g) || []).length;
  patterns.storage_access = (bytecode.match(/5[0-5]/g) || []).length; // SLOAD, SSTORE
  patterns.external_calls = (bytecode.match(/f[1-4]/g) || []).length; // CALL, DELEGATECALL, etc.
  patterns.math_operations = (bytecode.match(/0[0-1]/g) || []).length; // ADD, MUL
  patterns.control_flow = (bytecode.match(/5[6-7]/g) || []).length; // JUMP, JUMPI

  return patterns;
}

function analyzeConstructor(bytecode: string) {
  // El constructor suele estar al inicio del bytecode
  const constructorEnd = bytecode.indexOf('f3'); // RETURN opcode
  
  if (constructorEnd !== -1) {
    return {
      has_constructor: true,
      constructor_length: constructorEnd + 2,
      constructor_preview: bytecode.substring(0, Math.min(200, constructorEnd)) + '...'
    };
  }
  
  return { has_constructor: false };
}