import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import z from "zod";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: __dirname + '/../.env' });

const API_BASE = process.env.API_BASE;
const USER_AGENT = process.env.USER_AGENT;
const TOKEN = process.env.TOKEN;

const server = new McpServer({
  name: process.env.SERVER_NAME || "Nocobase MCP Server",
  version: process.env.SERVER_VERSION || "1.0.0",
});

/**
 * Type definition for the Foods data structure.
 * Represents the structure of food items returned by the API.
 */
type Product = {
  data?: {
    id?: number;
    category?: string;
    title?: string;
    description?: string;
    price?: string;
    cep?: string;
  }[];
};

type SalesOrder = {
  data?: {
    title?: string,
    id: number,
    total_order: string,
    status: string,
    cep: string
  }
};

/**
 * Calls the API to get payment information based on document ID.
 *
 * @param url
 * @param method
 * @param body
 * @returns
 */
async function makeRequest<T>(
  url: string,
  method: string,
  body?: any
): Promise<T | null> {
  const headers = {
    "User-Agent": USER_AGENT || "nocobase-mcp-agent/1.0",
    Accept: "application/json",
    Authorization: `Bearer ${TOKEN}` || "",
    "Content-Type": "application/json",
  };

  const options: RequestInit = {
    method: method,
    headers: headers,
  };

  if (body && ["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(
      `Received parameters: URL: ${API_BASE} -  AGENT: ${USER_AGENT} - TOKEN: ${TOKEN}`
    );
    console.error("Error making request:", error);
    return null;
  }
}

/**
 * Tool to list all food items available for a given ZIP code (CEP).
 * It requires the CEP to be specified.
 */
server.tool(
  "Produtos-Tool",
  "Busca todos os produtos disponíveis para o CEP informado.",
  {
    cep: z.string().trim(),
  },
  async ({cep}) => {
    const url = `${API_BASE}/api/portifolio:list?filter=%7B%7D`;
    const data = await makeRequest<Product>(url, "GET");

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Não existe produto(s) para o CEP informado. Tente pesquisar o outro CEP!",
          },
        ],
      };
    }

    var text: string = `Produtos disponíveis para o CEP: ${cep}\n\n`;

    if (data.data && Array.isArray(data.data)) {
        data.data.forEach(food => {
          text += `{ID_produto: ${food.id}\n`;
          text += `Categoria do produto: ${food.category}\n`;
          text += `Título: ${food.title}\n`;
          text += `Descrição: ${food.description}\n`;
          text += `Preço: ${food.price}\n`;
          text += `CEP: ${food.cep}\n`;
          text += "}\n";
      });
    }

    return {
      content: [
        {
          type: "text",
          text: text,
        },
      ],
    };
  }
);

/**
 * Tool to open a shopping cart for a given ZIP code (CEP).
 * It requires the CEP to be specified.
 */
server.tool(
  "Abrir-Carrinho-Tool",
  "Abrir carrinho para adicionar produtos. Dados necessários: cep de entrega.",
  {
    cep: z.string().trim(),
  },
  async ({ cep }) => {    

    const body = {
      title: `Pedido para entrega no CEP ${cep}`,
      cep: cep,
      status: "Aberto"
    };

    const url = `${API_BASE}/api/sales_order:create`;
    const data = await makeRequest<SalesOrder>(url, "POST", body);

    if (data && data.data) {
      return {
        content: [
          {
            type: "text",
            text: `Carrinho aberto com sucesso! O ID do pedido é ${data.data.id}. Agora você pode ver a listagem de produtos.\n\n`,
          },
        ],
      };
    }
      
    return {
      content: [
        {
          type: "text",
          text: "Não foi possível abrir o carrinho. Tente novamente mais!",
        },
      ],
    };
  }
);

/**
 * Tool to add food items to the shopping cart.
 * It requires the food ID, quantity, and order ID to be specified.
 */
server.tool(
  "Adicionar-Produtos-Carrinho-Tool",
  "Adicionar múltiplos produtos no carrinho já aberto. Dados necessários: ID do produto, quantidade, e ID da pedido.",
  {
    product_id: z.number().min(1),
    quantity: z.number().min(1),
    order_id: z.number().min(0),
  },
  async ({ product_id, quantity, order_id }) => {    

    if (product_id <= 0 || quantity <= 0 || order_id <= 0 ) {
      return {
        content: [
          {
            type: "text",
            text: "Não foi possivel adicionar produtos pois não foi informado os dados necessários. Tente novamente mais!",
          },
        ],
      };
    }

    const body = {
      "sales_order_id": order_id,
      "portifolio_id": product_id,
      "quantity": quantity
    };

    const url = `${API_BASE}/api/order_portifolio:create`;
    const data = await makeRequest<SalesOrder>(url, "POST", body);

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Não foi possível adicionar o produto no carrinho. Tente novamente mais!",
          },
        ],
      };
    } 

    return {
      content: [
        {
          type: "text",
          text: "Produto(s) adicionado(s) no carrinho com sucesso!\n\n",
        },
      ],
    };
  }
);

/**
 * Tool to remove food items from the shopping cart.
 * It requires an array of items with food ID and order ID to be specified.
 */
server.tool(
  "Remover-Produtos-Carrinho-Tool",
  "Remover múltiplos produtos. Dados necessários: array de itens com ID do alimento e ID da ordem.",
  {
    items: z.array(z.object({
      food_id: z.number().min(1),
      order_id: z.number().min(1)
    }))
  },
  async ({ items }) => {    

    if (items.length === 0 ) {
      return {
        content: [
          {
            type: "text",
            text: "Não foi possivel remover produto(s) pois não foi informado os dados necessários. Tente novamente mais!",
          },
        ],
      };
    }

    for (const item of items) {

      const url = `${API_BASE}/api/order_portifolio:destroy?filter=%7B%0A%22sales_order_id%22%3A%20${item.order_id}%2C%0A%22portifolio_id%22%3A%20${item.food_id}%0A%7D`;
      const data = await makeRequest<SalesOrder>(url, "POST");

      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: "Não foi possível remover o produto no carrinho. Tente novamente mais!",
            },
          ],
        };
      } 
    }

    return {
      content: [
        {
          type: "text",
          text: "Produto(s) adicionado(s) no carrinho com sucesso!\n\n",
        },
      ],
    };
  }
);

/**
 * Tool to finalize the shopping cart.
 * It requires the order ID to be specified.
 */
server.tool(
  "Finalizar-Carrinho-Tool",
  "Finalizar as compras no carrinho . Dados necessários: Id da Ordem de compra.",
  {
    order_id: z.number().min(0),
  },
  async ({ order_id }) => {    

    if (order_id === 0 ) {
      return {
        content: [
          {
            type: "text",
            text: "Não foi possivel finalizar o carrinho pois não foi informado os dados necessários. Tente novamente mais!",
          },
        ],
      };
    }

    const url = `${API_BASE}/api/sales_order:update?filterByTk=${order_id}`;
    const data = await makeRequest<SalesOrder>(url, "POST", {status: "Finalizado"});

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Não foi possível finalizar carrinho. Tente novamente mais!",
          },
        ],
      };
    } 

    return {
      content: [
        {
          type: "text",
          text: "Carrinho fechado com sucesso!\n\n",
        },
      ],
    };
  }
);

/**
 * Main function to start the MCP server.
 * It connects the server to the standard input/output transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

/**
 * Handles uncaught exceptions and unhandled promise rejections.
 */
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
