# NocoBase MCP Server

Servidor MCP (Model Context Protocol) para integração com a plataforma NocoBase, permitindo criação e gerenciamento de UI Schemas através da API oficial do NocoBase via transporte stdio.

## 🚀 Características

- ✅ **Integração com API NocoBase** - Usa endpoints oficiais `/api/uiSchemas`
- ✅ **Protocolo MCP via stdio** - Comunicação padrão via entrada/saída
- ✅ **Gerenciamento de UI Schemas** - Insert, update, remove, patch
- ✅ **Criação de páginas e blocos** - Tables, forms, menus
- ✅ **Suporte a templates** - Save as template
- ✅ **Batch operations** - Atualização em lote
- ✅ **Debug completo** - Logs detalhados para desenvolvimento

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/nocobase-mcp-server.git
cd nocobase-mcp-server

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do NocoBase

# Torne o servidor executável
chmod +x server.js
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
# URL da API do NocoBase
NOCOBASE_API_URL=http://localhost:13000

# Credenciais de autenticação (opcional)
NOCOBASE_API_KEY=your-api-key
NOCOBASE_TOKEN=your-bearer-token

# Modo debug
DEBUG=1
```

## 🎯 Uso

### Como servidor standalone

```bash
# Modo normal
npm start

# Modo debug (com logs detalhados)
npm run dev
```

### Integração com NocoBase

Configure o servidor MCP no NocoBase adicionando ao arquivo de configuração:

```json
{
  "mcp": {
    "servers": [
      {
        "command": "node",
        "args": ["/caminho/para/server.js"],
        "transport": "stdio"
      }
    ]
  }
}
```

## 🛠️ Ferramentas Disponíveis

### 1. configure
Configura as credenciais de conexão com o NocoBase.

```javascript
{
  baseUrl: "http://localhost:13000",
  apiKey: "your-api-key",
  token: "your-bearer-token"
}
```

### 2. createPage
Cria uma nova página no NocoBase.

```javascript
{
  name: "my-page",
  title: "My Page"
}
```

### 3. createMenu
Cria um item de menu na navegação.

```javascript
{
  title: "User Management",
  icon: "UserOutlined",
  path: "/users",
  parent: "parent-uid" // opcional
}
```

### 4. createBlock
Cria blocos de interface (tabelas, formulários).

```javascript
{
  type: "table", // ou "form", "details"
  collection: "users",
  parentUid: "page-uid",
  position: "beforeEnd"
}
```

### 5. addFieldToForm
Adiciona campos a um formulário existente.

```javascript
{
  formUid: "form-grid-uid",
  field: {
    name: "description",
    title: "Description",
    type: "text"
  },
  collection: "users"
}
```

### 6. updateSchema
Atualiza propriedades de um schema existente.

```javascript
{
  uid: "schema-uid",
  updates: {
    title: "New Title",
    "x-component-props": { /* ... */ }
  }
}
```

### 7. removeSchema
Remove um schema e opcionalmente seus filhos.

```javascript
{
  uid: "schema-uid",
  removeChildren: true
}
```

### 8. getSchema
Obtém um schema por UID.

```javascript
{
  uid: "schema-uid",
  includeProperties: true
}
```

### 9. saveAsTemplate
Salva um schema como template reutilizável.

```javascript
{
  uid: "schema-uid",
  name: "my-template",
  collection: "users"
}
```

### 10. createCollection
Cria uma nova collection (tabela).

```javascript
{
  name: "products",
  title: "Products",
  fields: [
    {
      name: "name",
      type: "string",
      title: "Product Name"
    }
  ]
}
```

### 11. batchUpdate
Atualiza múltiplos schemas de uma vez.

```javascript
{
  updates: [
    {
      "x-uid": "uid1",
      title: "New Title 1"
    },
    {
      "x-uid": "uid2",
      title: "New Title 2"
    }
  ]
}
```

## 🧪 Testes

Execute o cliente de teste para verificar todas as funcionalidades:

```bash
npm test
```

O cliente de teste irá:
1. Conectar ao servidor
2. Criar collections de exemplo
3. Criar menus e blocos
4. Estabelecer relações
5. Validar schemas
6. Executar comandos customizados
7. Listar todos os recursos criados

## 📝 Estrutura do UI Schema

O servidor trabalha com a estrutura oficial de UI Schema do NocoBase:

```javascript
{
  "x-uid": "unique-identifier",
  "type": "void|object|array|string",
  "x-component": "ComponentName",
  "x-component-props": { /* props */ },
  "x-decorator": "DecoratorName",
  "x-decorator-props": { /* props */ },
  "x-initializer": "InitializerName",
  "properties": { /* nested schemas */ }
}
```

### Componentes Principais

- **Page** - Container de página
- **Grid** - Layout em grid
- **Table/TableV2** - Tabelas de dados
- **Form/FormV2** - Formulários
- **CardItem** - Container tipo card
- **ActionBar** - Barra de ações
- **Menu/Menu.Item** - Navegação
- **CollectionField** - Campos de collection

## 🔧 API Endpoints Utilizados

O servidor utiliza os seguintes endpoints da API do NocoBase:

- `GET /api/uiSchemas:getJsonSchema/{uid}` - Obtém schema JSON
- `GET /api/uiSchemas:getProperties/{uid}` - Obtém propriedades
- `POST /api/uiSchemas:insert` - Insere novo schema
- `POST /api/uiSchemas:remove/{uid}` - Remove schema
- `POST /api/uiSchemas:patch` - Atualiza schema
- `POST /api/uiSchemas:batchPatch` - Atualização em lote
- `POST /api/uiSchemas:clearAncestor/{uid}` - Limpa ancestrais
- `POST /api/uiSchemas:insertAdjacent/{uid}` - Insere adjacente
- `POST /api/uiSchemas:saveAsTemplate` - Salva como template

## 📄 Licença

MIT

## 🤝 Contribuições

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 🐛 Problemas Conhecidos e Soluções

### Erro de Autenticação
Se você receber erro 401 ou 403:
1. Verifique se o NocoBase está rodando
2. Confirme as credenciais no arquivo `.env`
3. Gere um novo token de API no NocoBase Admin

### Erro ao Criar Schema
Se schemas não são criados:
1. Verifique se o usuário tem permissão para `uiSchemas`
2. Confirme que a collection existe antes de criar blocos
3. Use UIDs válidos para elementos pai

### Conexão Recusada
Se não conseguir conectar:
1. Verifique a URL do NocoBase (padrão: http://localhost:13000)
2. Confirme que o NocoBase está acessível
3. Teste a API diretamente: `curl http://localhost:13000/api/collections:list`

## 📚 Recursos Adicionais

- [Documentação NocoBase UI Schema](https://docs.nocobase.com/development/client/ui-schema/what-is-ui-schema)
- [Especificação MCP](https://modelcontextprotocol.io)
- [SDK MCP](https://github.com/modelcontextprotocol/sdk)