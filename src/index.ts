import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import z from "zod";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// recria __dirname no ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// agora funciona
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
type Foods = {
  data?: {
    id?: number;
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

type TicketProtocolResponse = {
  data?: {
    protocol?: string;
  };
};

type TicketResponse = {
  data?: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
  };
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
 * Tool to fetch all available food items registered in the CRM.
 */
server.tool(
  "Alimentos",
  "Busca todos os alimentos disponíveis para venda cadastrado no crm para o CEP informado.",
  {
    cep: z.string().trim(),
  },
  async ({cep}) => {
    const url = `${API_BASE}/api/portifolio:list?filter=%7B%7D`;
    const data = await makeRequest<Foods>(url, "GET");

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Não existe alimentos cadastrado para o CEP informado!",
          },
        ],
      };
    }

    var text: string = "Alimentos disponíveis:\n\n";

    if (data.data && Array.isArray(data.data)) {
        data.data.forEach(food => {
          text += `{ID: ${food.id}\n`;
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
 * Tool to purchase food items available in the CRM.
 * It requires the food ID and quantity to be specified.
 */
server.tool(
  "Comprar-Alimentos",
  "Realiza a compra de múltiplos alimentos disponíveis no CRM. Dados necessários: array de itens com ID, quantidade e preço unitário, total do pedido e cep de entrega.",
  {
    items: z.array(z.object({
      food_id: z.string().trim(),
      quantity: z.number().min(1)
    })),
    total_order: z.number().min(0),
    cep: z.string().trim(),
  },
  async ({ items, total_order, cep }) => {    

    const body = {
      "title": "Pedido #123",
      "total_order": total_order,
      "status": "Realizada",
      "cep": cep
    };

    //Create a sales order
    const url = `${API_BASE}/api/sales_order:create`;
    const data = await makeRequest<SalesOrder>(
      url,
      "POST",
      body
    );

    if (data) {

      // Associate the food items with the sales order
      const url = `${API_BASE}/api/order_portifolio:create`;

      for (const item of items) {

        const bodyItem = {
          "sales_order_id": data.data?.id,
          "portifolio_id": item.food_id,
          "quantity": item.quantity
        };

        const dataItem = await makeRequest<SalesOrder>(
          url,
          "POST",
          bodyItem
        );
      }
    }

    var text: string = "Alimentos comprados com sucesso!\n\n";

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

server.tool(
  "buscar-ticket",
  "Solicitar informações de um ticket. Informações que o usuário deve enviar: Protocolo",
  {
    protocol: z.string().trim(),
  },
  async ({ protocol }) => {
    const ticketUrl = `${API_BASE}/api/ticket:get?filter=%7B%22protocol%22%3A%20%22${protocol}%22%7D`;
    const ticketData = await makeRequest<TicketResponse>(
      ticketUrl,
      "GET"
    );

    if (!ticketData) {
      return {
        content: [
          {
            type: "text",
            text: "Não foi encontrado ticket para o protocolo informado!",
          },
        ],
      };
    }

    const ticketText = `Os dados do ticket são: - Titulo: ${ticketData.data?.title} - Descrição: ${ticketData.data?.description} - Status: ${ticketData.data?.status} - Prioridade: ${ticketData.data?.priority}.`;

    return {
      content: [
        {
          type: "text",
          text: ticketText,
        },
      ],
    };
  }
);

server.tool(
  "abrir-ticket",
  "Abrir um novo ticket. Informações que o usuário deve enviar: Título, Descrição",
  {
    title: z.string().trim(),
    description: z.string().trim(),
  },
  async ({ title, description }) => {
    const body = {
      title: title,
      description: description,
      status: "Aberto",
      priority: "Normal",
    };

    const ticketUrl = `${API_BASE}/api/ticket:create`;
    const ticketData = await makeRequest<TicketProtocolResponse>(
      ticketUrl,
      "POST",
      body
    );

    if (!ticketData) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to open the ticket",
          },
        ],
      };
    }

    const responseText = `O ticket foi aberto com sucesso. Segue o numero do protocolo:  ${ticketData.data?.protocol}`;

    return {
      content: [
        {
          type: "text",
          text: responseText,
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
