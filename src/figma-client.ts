import axios from "axios";

// Define types for Figma API responses
export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  [key: string]: any;
}

export interface GetFileResponse {
  document: {
    children: FigmaNode[];
    [key: string]: any;
  };
  components: Record<string, any>;
  styles: Record<string, any>;
  [key: string]: any;
}

export interface GetFileNodesResponse {
  nodes: Record<
    string,
    {
      document: FigmaNode;
      components?: Record<string, any>;
      styles?: Record<string, any>;
      [key: string]: any;
    }
  >;
}

export class FigmaClient {
  private token: string;
  private baseUrl = "https://api.figma.com/v1";

  constructor(token: string) {
    this.token = token;
  }

  async getFile(fileKey: string): Promise<GetFileResponse> {
    try {
      const response = await axios.get<GetFileResponse>(
        `${this.baseUrl}/files/${fileKey}`,
        {
          headers: {
            "X-Figma-Token": this.token,
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Figma API error: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  async getFileNodes(
    fileKey: string,
    nodeIds: string[]
  ): Promise<GetFileNodesResponse> {
    try {
      const response = await axios.get<GetFileNodesResponse>(
        `${this.baseUrl}/files/${fileKey}/nodes`,
        {
          params: { ids: nodeIds.join(",") },
          headers: {
            "X-Figma-Token": this.token,
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Figma API error: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  async getImageFills(
    fileKey: string,
    nodeIds: string[]
  ): Promise<Record<string, string>> {
    try {
      const response = await axios.get(`${this.baseUrl}/images/${fileKey}`, {
        params: { ids: nodeIds.join(","), format: "png" },
        headers: {
          "X-Figma-Token": this.token,
        },
      });
      return response.data.images || {};
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Figma API error: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  async getComponentSets(fileKey: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/files/${fileKey}/component_sets`,
        {
          headers: {
            "X-Figma-Token": this.token,
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Figma API error: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }
}
