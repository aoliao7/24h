<script setup lang="ts">
import { ref, computed, markRaw, type Component, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { VueFlow, useVueFlow, MarkerType } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import { ElMessage, ElMessageBox } from "element-plus";
import WorkflowNode from "./components/WorkflowNode.vue";
import { useCreativeStore, calculateWorkflowCost } from "../stores/creative";
import SharePanel from "./components/SharePanel.vue";
import * as echarts from "echarts";

const store = useCreativeStore();

const route = useRoute();
const router = useRouter();

// ============================================================
// 导航
// ============================================================
const goToPermissions = () => {
  const draft = currentDraft.value;
  const workflowId = draft?.id || route.params.id || "default";
  router.push(`/workflows/${workflowId}/permissions`);
};

// ============================================================
// 数据类型系统
// ============================================================
type DataType = "image" | "text" | "video" | "none";

const DATA_TYPE_COLORS: Record<DataType, string> = {
  image: "#4ecdc4",
  text: "#a78bfa",
  video: "#60a5fa",
  none: "#9ca3af",
};

const DATA_TYPE_LABELS: Record<DataType, string> = {
  image: "图片",
  text: "文本",
  video: "视频",
  none: "无",
};

// ============================================================
// 节点类型定义
// ============================================================
interface Port {
  id: string;
  label: string;
  type: DataType;
  position: "left" | "right";
}

interface NodeDef {
  id: string;
  name: string;
  desc: string;
  category: "input" | "ai" | "process" | "output";
  inputs: Port[];
  outputs: Port[];
  color: string;
}

const nodeDefinitions: NodeDef[] = [
  {
    id: "product-image",
    name: "产品图片",
    desc: "上传产品图片作为工作流起点",
    category: "input",
    color: "#4ecdc4",
    inputs: [],
    outputs: [
      { id: "out-image", label: "图片", type: "image", position: "right" },
    ],
  },
  {
    id: "product-text",
    name: "产品描述",
    desc: "输入产品描述文字",
    category: "input",
    color: "#a78bfa",
    inputs: [],
    outputs: [
      { id: "out-text", label: "文本", type: "text", position: "right" },
    ],
  },
  {
    id: "ai-image-gen",
    name: "AI 图片生成",
    desc: "根据描述生成高质量图片",
    category: "ai",
    color: "#a78bfa",
    inputs: [
      { id: "in-image", label: "参考图", type: "image", position: "left" },
      { id: "in-text", label: "描述", type: "text", position: "left" },
    ],
    outputs: [
      { id: "out-image", label: "图片", type: "image", position: "right" },
    ],
  },
  {
    id: "ai-video-gen",
    name: "AI 视频生成",
    desc: "将静态图片转为动态视频",
    category: "ai",
    color: "#60a5fa",
    inputs: [
      { id: "in-image", label: "图片", type: "image", position: "left" },
    ],
    outputs: [
      { id: "out-video", label: "视频", type: "video", position: "right" },
    ],
  },
  {
    id: "style-filter",
    name: "风格滤镜",
    desc: "应用预设风格滤镜组合",
    category: "process",
    color: "#34d399",
    inputs: [
      { id: "in-image", label: "图片", type: "image", position: "left" },
    ],
    outputs: [
      { id: "out-image", label: "图片", type: "image", position: "right" },
    ],
  },
  {
    id: "text-add",
    name: "文字添加",
    desc: "在图片指定位置添加文字",
    category: "process",
    color: "#34d399",
    inputs: [
      { id: "in-image", label: "图片", type: "image", position: "left" },
      { id: "in-text", label: "文本", type: "text", position: "left" },
    ],
    outputs: [
      { id: "out-image", label: "图片", type: "image", position: "right" },
    ],
  },
  {
    id: "smart-crop",
    name: "智能裁剪",
    desc: "智能识别主体并裁剪",
    category: "process",
    color: "#4ecdc4",
    inputs: [
      { id: "in-image", label: "图片", type: "image", position: "left" },
    ],
    outputs: [
      { id: "out-image", label: "图片", type: "image", position: "right" },
    ],
  },
  {
    id: "export-image",
    name: "导出图片",
    desc: "导出最终图片成品",
    category: "output",
    color: "#f59e0b",
    inputs: [
      { id: "in-image", label: "图片", type: "image", position: "left" },
    ],
    outputs: [],
  },
  {
    id: "export-video",
    name: "导出视频",
    desc: "导出最终视频成品",
    category: "output",
    color: "#f59e0b",
    inputs: [
      { id: "in-video", label: "视频", type: "video", position: "left" },
    ],
    outputs: [],
  },
];

const nodeGroupMap: Record<string, NodeDef[]> = {
  输入: nodeDefinitions.filter((n) => n.category === "input"),
  AI: nodeDefinitions.filter((n) => n.category === "ai"),
  处理: nodeDefinitions.filter((n) => n.category === "process"),
  输出: nodeDefinitions.filter((n) => n.category === "output"),
};

const nodeTypes: Record<string, Component> = {
  custom: markRaw(WorkflowNode) as Component,
};

// ============================================================
// 节点实例
// ============================================================
let nodeCounter = 0;
const makeNodeId = () => `node-${++nodeCounter}-${Date.now()}`;

interface NodeData {
  status: "idle" | "running" | "done";
  outputData: { type: DataType; label: string } | null;
  imageUrl?: string;
  textContent?: string;
  filterPreset?: string;
  textContentNode?: string;
  textPosition?: string;
  cropAspect?: string;
  aiImageModel?: string;
  aiImageSize?: string;
  aiVideoDuration?: string;
  aiVideoMotion?: string;
  // 生成后的内容
  generatedImageUrl?: string;
  generatedVideoUrl?: string;
}

interface VueFlowNode {
  id: string;
  type: string;
  label: string;
  nodeDefId: string;
  data: NodeData;
  position: { x: number; y: number };
}

interface VueFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  animated?: boolean;
  style?: any;
  markerEnd?: any;
  data?: any;
}

// ============================================================
// 草稿管理
// ============================================================
interface Collaborator {
  userId: string;
  name: string;
  email: string;
  role: "owner" | "consumer" | "viewer";
  credits: number;
  invitedAt: string;
}

interface Draft {
  id: string;
  name: string;
  nodes: VueFlowNode[];
  edges: VueFlowEdge[];
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  collaborators: Collaborator[];
  shareToken?: string;
  isPublic: boolean;
}

const generateShareToken = () =>
  `wf_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;

// 当前用户固定为 owner 角色（最大权限）
const currentUserId = "user-owner-admin";

const drafts = ref<Draft[]>([
  {
    id: "default",
    name: "工作流 1",
    nodes: [
      {
        id: "n1",
        type: "custom",
        label: "产品图片",
        nodeDefId: "product-image",
        position: { x: 100, y: 200 },
        data: { status: "idle", outputData: null, imageUrl: "" },
      },
      {
        id: "n2",
        type: "custom",
        label: "AI 图片生成",
        nodeDefId: "ai-image-gen",
        position: { x: 360, y: 200 },
        data: {
          status: "idle",
          outputData: null,
          aiImageModel: "标准",
          aiImageSize: "1024×1024",
        },
      },
      {
        id: "n3",
        type: "custom",
        label: "风格滤镜",
        nodeDefId: "style-filter",
        position: { x: 620, y: 200 },
        data: { status: "idle", outputData: null, filterPreset: "自然" },
      },
      {
        id: "n4",
        type: "custom",
        label: "导出图片",
        nodeDefId: "export-image",
        position: { x: 880, y: 200 },
        data: { status: "idle", outputData: null },
      },
    ],
    edges: [
      {
        id: "e-n1-n2",
        source: "n1",
        target: "n2",
        sourceHandle: "out-image",
        targetHandle: "in-image",
        animated: true,
        style: { stroke: "#4ecdc4", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#4ecdc4" },
        data: { dataType: "image" },
      },
      {
        id: "e-n2-n3",
        source: "n2",
        target: "n3",
        sourceHandle: "out-image",
        targetHandle: "in-image",
        animated: true,
        style: { stroke: "#a78bfa", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#a78bfa" },
        data: { dataType: "image" },
      },
      {
        id: "e-n3-n4",
        source: "n3",
        target: "n4",
        sourceHandle: "out-image",
        targetHandle: "in-image",
        animated: true,
        style: { stroke: "#34d399", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#34d399" },
        data: { dataType: "image" },
      },
    ],
    createdAt: new Date().toLocaleDateString("zh-CN"),
    updatedAt: new Date().toLocaleDateString("zh-CN"),
    ownerId: currentUserId,
    collaborators: [],
    shareToken: "",
    isPublic: false,
  },
]);

const currentDraftId = ref<string>("default");

const currentDraft = computed(
  () =>
    drafts.value.find((d) => d.id === currentDraftId.value) || drafts.value[0],
);

const currentUserRole = computed(() => {
  const draft = currentDraft.value;
  if (!draft) return "viewer";
  if (draft.ownerId === currentUserId) return "owner";
  const collab = draft.collaborators.find((c) => c.userId === currentUserId);
  return collab?.role || "viewer";
});

const hasPermission = (
  permission: "view" | "edit" | "run" | "share" | "download" | "consume",
) => {
  const role = currentUserRole.value;
  if (role === "owner") return true;
  if (role === "consumer")
    return ["view", "edit", "run", "consume", "download"].includes(permission);
  return permission === "view" || permission === "download";
};

const shareTokenRoute = computed(() => {
  const token = currentDraft.value.shareToken;
  return token ? `/canvas/share/${token}` : "";
});

const generateShareLink = () => {
  const draft = currentDraft.value;
  if (!draft) return;
  draft.shareToken = generateShareToken();
  ElMessage.success("共享链接已生成");
};

const togglePublic = () => {
  const draft = currentDraft.value;
  if (!draft) return;
  draft.isPublic = !draft.isPublic;
  ElMessage.success(draft.isPublic ? "已开启公开访问" : "已关闭公开访问");
};

const inviteCollaborator = (email: string, role: "consumer" | "viewer") => {
  const draft = currentDraft.value;
  if (!draft) return;
  if (draft.collaborators.some((c) => c.email === email)) {
    ElMessage.warning("该成员已在协作者列表中");
    return;
  }
  draft.collaborators.push({
    userId: "user-" + Math.random().toString(36).slice(2, 8),
    name: email.split("@")[0],
    email,
    role,
    invitedAt: new Date().toLocaleDateString("zh-CN"),
  });
  ElMessage.success("邀请成功");
};

const removeCollaborator = (userId: string) => {
  const draft = currentDraft.value;
  if (!draft) return;
  draft.collaborators = draft.collaborators.filter((c) => c.userId !== userId);
  ElMessage.success("已移除");
};

const roleLabels: Record<string, string> = {
  owner: "拥有者",
  consumer: "可消耗点数",
  viewer: "仅查看素材",
};

const showCollabPanel = ref(false);

const members = computed(() => {
  const draft = currentDraft.value;
  if (!draft) return [];
  return [
    {
      userId: draft.ownerId,
      name: "我",
      email: "owner@example.com",
      role: "owner",
      invitedAt: draft.createdAt,
    },
    ...draft.collaborators,
  ];
});

const canEditRole = (member: { userId: string; role: string }) => {
  const role = currentUserRole.value;
  if (role !== "owner") return false;
  if (member.role === "owner") return false;
  return true;
};

const canRemoveMember = (member: { userId: string; role: string }) => {
  const role = currentUserRole.value;
  if (role !== "owner") return false;
  if (member.role === "owner") return false;
  return true;
};

const updateMemberRole = (userId: string, role: "consumer" | "viewer") => {
  const draft = currentDraft.value;
  if (!draft) return;
  const member = draft.collaborators.find((c) => c.userId === userId);
  if (!member) return;
  member.role = role;
  if (role === "viewer") {
    member.credits = 0;
  }
  ElMessage.success("权限已更新");
};

const removeMember = (userId: string) => {
  removeCollaborator(userId);
};

const inviteEmail = ref("");
const inviteRole = ref<"consumer" | "viewer">("consumer");

const inviteMember = () => {
  const email = inviteEmail.value.trim();
  if (!email) {
    ElMessage.warning("请输入邮箱");
    return;
  }
  inviteCollaborator(email, inviteRole.value);
  inviteEmail.value = "";
};

const canRunWorkflow = computed(() => {
  const role = currentUserRole.value;
  if (role === "viewer") return false;
  return true;
});

const nodes = ref<VueFlowNode[]>([...currentDraft.value.nodes]);
const edges = ref<VueFlowEdge[]>([...currentDraft.value.edges]);

console.log(
  "初始化节点数量:",
  nodes.value.length,
  "边数量:",
  edges.value.length,
);
console.log(
  "当前草稿:",
  currentDraft.value.name,
  "节点:",
  currentDraft.value.nodes.map((n) => n.id),
);

const switchDraft = (draftId: string) => {
  const draft = drafts.value.find((d) => d.id === draftId);
  if (!draft) return;
  currentDraftId.value = draftId;
  nodes.value = draft.nodes.map((n) => ({ ...n, data: { ...n.data } }));
  edges.value = [...draft.edges];
  ElMessage.success(`已切换到：${draft.name}`);
};

const saveDraft = () => {
  const draft = drafts.value.find((d) => d.id === currentDraftId.value);
  if (!draft) return;
  draft.nodes = nodes.value.map((n) => ({ ...n, data: { ...n.data } }));
  draft.edges = [...edges.value];
  draft.updatedAt = new Date().toLocaleDateString("zh-CN");
  ElMessage.success("草稿已保存");
};

const createDraft = () => {
  const id = `draft-${Date.now()}`;
  const draft: Draft = {
    id,
    name: `工作流 ${drafts.value.length + 1}`,
    nodes: [],
    edges: [],
    createdAt: new Date().toLocaleDateString("zh-CN"),
    updatedAt: new Date().toLocaleDateString("zh-CN"),
    ownerId: currentUserId,
    collaborators: [],
    shareToken: "",
    isPublic: false,
  };
  drafts.value.push(draft);
  currentDraftId.value = id;
  nodes.value = [];
  edges.value = [];
  ElMessage.success("已创建新草稿");
};

const deleteDraft = (draftId: string) => {
  if (drafts.value.length <= 1) {
    ElMessage.warning("至少保留一个草稿");
    return;
  }
  drafts.value = drafts.value.filter((d) => d.id !== draftId);
  if (currentDraftId.value === draftId) {
    currentDraftId.value = drafts.value[0].id;
    nodes.value = [...drafts.value[0].nodes];
    edges.value = [...drafts.value[0].edges];
  }
  ElMessage.info("草稿已删除");
};

// ============================================================
// 模板加载
// ============================================================
interface TemplateNode {
  id: string;
  nodeDefId: string;
  position: { x: number; y: number };
}

interface TemplateEdge {
  id: string;
  source: string;
  target: string;
  sourcePort: string;
  targetPort: string;
  type: string;
}

interface TemplateData {
  id: string;
  name: string;
  category: "video" | "image";
  nodes: TemplateNode[];
  edges: TemplateEdge[];
  prompt: string;
}

const loadTemplateFromStorage = () => {
  const templateJson = sessionStorage.getItem("template");
  if (!templateJson) return;

  try {
    const template: TemplateData = JSON.parse(templateJson);

    // 获取默认节点数据
    const getDefaultNodeData = (defId: string): NodeData => {
      const base: NodeData = { status: "idle", outputData: null };
      if (defId === "product-image") base.imageUrl = "";
      if (defId === "product-text") base.textContent = template.prompt || "";
      if (defId === "style-filter") base.filterPreset = "自然";
      if (defId === "text-add") {
        base.textContentNode = "";
        base.textPosition = "center";
      }
      if (defId === "smart-crop") base.cropAspect = "1:1";
      if (defId === "ai-image-gen") {
        base.aiImageModel = "标准";
        base.aiImageSize = "1024×1024";
      }
      if (defId === "ai-video-gen") {
        base.aiVideoDuration = "4秒";
        base.aiVideoMotion = "自动";
      }
      return base;
    };

    // 转换节点
    const loadedNodes: VueFlowNode[] = template.nodes.map((n) => {
      const def = nodeDefinitions.find((d) => d.id === n.nodeDefId);
      return {
        id: n.id,
        type: "custom",
        label: def?.name || n.nodeDefId,
        nodeDefId: n.nodeDefId,
        position: n.position,
        data: getDefaultNodeData(n.nodeDefId),
      };
    });

    // 使用模板中预定义的连线
    const loadedEdges: VueFlowEdge[] = (template.edges || []).map((e: any) => {
      const color = DATA_TYPE_COLORS[e.type as DataType] || "#9ca3af";
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourcePort,
        targetHandle: e.targetPort,
        animated: true,
        style: { stroke: color, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color },
        data: { dataType: e.type },
      };
    });

    // 更新草稿
    const draft = drafts.value.find((d) => d.id === currentDraftId.value);
    if (draft) {
      draft.name = template.name;
      draft.nodes = loadedNodes;
      draft.edges = loadedEdges;
      draft.updatedAt = new Date().toLocaleDateString("zh-CN");
    }

    nodes.value = loadedNodes;
    edges.value = loadedEdges;

    // 清除 sessionStorage
    sessionStorage.removeItem("template");

    ElMessage.success(`已加载模板「${template.name}」`);
  } catch (e) {
    console.error("加载模板失败:", e);
    ElMessage.error("模板加载失败");
  }
};

// 页面加载时检查 sessionStorage
onMounted(() => {
  loadTemplateFromStorage();
});

// ============================================================
// 工作流执行模拟
// ============================================================
type RunStatus = "idle" | "running" | "done";

const runStatus = ref<RunStatus>("idle");
const runProgress = ref(0);
const runningNodeId = ref<string | null>(null);

const showSharePanel = ref(false);

// 计算工作流所需积分
const workflowCost = computed(() => calculateWorkflowCost(nodes.value));

const getNodeOutputType = (nodeDefId: string): DataType => {
  const def = nodeDefinitions.find((d) => d.id === nodeDefId);
  if (!def || def.outputs.length === 0) return "none";
  return def.outputs[0].type;
};

const runWorkflow = async () => {
  if (runStatus.value === "running") return;
  if (!hasPermission("run")) {
    ElMessage.error("当前角色无运行工作流权限");
    return;
  }
  const startNodes = nodes.value.filter((n) => {
    const def = nodeDefinitions.find((d) => d.id === n.nodeDefId);
    return def?.category === "input";
  });
  if (startNodes.length === 0) {
    ElMessage.warning("请先添加输入节点");
    return;
  }

  // 检查积分
  const cost = workflowCost.value;
  if (cost > 0) {
    if (store.credits < cost) {
      ElMessageBox.confirm(
        `当前工作流需要 ${cost} 积分，您的余额为 ${store.credits} 积分，余额不足。是否前往充值？`,
        "积分不足",
        {
          confirmButtonText: "前往充值",
          cancelButtonText: "取消",
          type: "warning",
        },
      )
        .then(() => {
          window.location.href = "/credits";
        })
        .catch(() => {});
      return;
    }

    // 确认扣费
    try {
      await ElMessageBox.confirm(
        `<div style="text-align:center">
          <div style="font-size:14px;color:#666;margin-bottom:8px">预估消耗</div>
          <div style="font-size:32px;font-weight:700;color:#4ecdc4">${cost}</div>
          <div style="font-size:12px;color:#999;margin-bottom:16px">积分</div>
          <div style="font-size:13px;color:#333">当前余额：${store.credits} 积分</div>
          <div style="font-size:13px;color:#333">生成后余额：${store.credits - cost} 积分</div>
        </div>`,
        "确认开始生成？",
        {
          confirmButtonText: "确认开始",
          cancelButtonText: "取消",
          dangerouslyUseHTMLString: true,
        },
      );
    } catch {
      return;
    }
  }

  runStatus.value = "running";
  runProgress.value = 0;
  ElMessage.info("开始执行工作流...");

  const adj: Record<string, string[]> = {};
  const inDeg: Record<string, number> = {};
  nodes.value.forEach((n) => {
    adj[n.id] = [];
    inDeg[n.id] = 0;
  });
  edges.value.forEach((e) => {
    if (!adj[e.source]) adj[e.source] = [];
    adj[e.source].push(e.target);
    inDeg[e.target] = (inDeg[e.target] || 0) + 1;
  });

  let queue = nodes.value.filter((n) => inDeg[n.id] === 0).map((n) => n.id);
  const sorted: string[] = [];
  const visited = new Set<string>();

  while (queue.length) {
    const cur = queue.shift()!;
    if (!visited.has(cur)) {
      sorted.push(cur);
      visited.add(cur);
    }
    for (const nxt of adj[cur] || []) {
      inDeg[nxt]--;
      if (inDeg[nxt] === 0) queue.push(nxt);
    }
  }
  nodes.value.forEach((n) => {
    if (!visited.has(n.id)) sorted.push(n.id);
  });

  const total = sorted.length;
  for (let i = 0; i < sorted.length; i++) {
    const nodeId = sorted[i];
    runningNodeId.value = nodeId;
    nodes.value = nodes.value.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, status: "running" } } : n,
    );
    const node = nodes.value.find((n) => n.id === nodeId)!;
    const def = nodeDefinitions.find((d) => d.id === node.nodeDefId)!;
    const outputType = getNodeOutputType(node.nodeDefId);

    // 模拟处理时间
    await new Promise((resolve) =>
      setTimeout(resolve, 700 + Math.random() * 500),
    );

    // 更新节点数据
    const updateData: any = {
      status: "done",
      outputData: { type: outputType, label: def.name },
    };

    // 导出节点生成模拟内容
    if (def.id === "export-image") {
      // 查找上游图片
      const upstreamImage = findUpstreamData(nodeId, "image");
      if (upstreamImage) {
        updateData.generatedImageUrl = upstreamImage;
      }
    } else if (def.id === "export-video") {
      // 查找上游视频或图片
      const upstreamVideo = findUpstreamData(nodeId, "video");
      const upstreamImage = findUpstreamData(nodeId, "image");
      if (upstreamVideo) {
        updateData.generatedVideoUrl = upstreamVideo;
      } else if (upstreamImage) {
        // 模拟视频：使用图片作为封面
        updateData.generatedVideoUrl = upstreamImage;
      }
    }

    nodes.value = nodes.value.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, ...updateData } } : n,
    );
    runProgress.value = Math.round(((i + 1) / total) * 100);
  }
  runningNodeId.value = null;
  runStatus.value = "done";

  // 扣除积分
  if (cost > 0) {
    store.deductCredits(cost, "工作流生成");
    ElMessage.success(
      `工作流执行完成！已消耗 ${cost} 积分，剩余 ${store.credits} 积分`,
    );
  } else {
    ElMessage.success("工作流执行完成！");
  }
  saveDraft();
};

// 查找上游数据
const findUpstreamData = (
  nodeId: string,
  dataType: "image" | "video",
): string | null => {
  const edge = edges.value.find((e) => e.target === nodeId);
  if (!edge) return null;
  const sourceNode = nodes.value.find((n) => n.id === edge.source);
  if (!sourceNode) return null;
  // 只有节点已完成时才返回图片
  if (sourceNode.data.status === "done") {
    if (sourceNode.data.generatedImageUrl) return sourceNode.data.generatedImageUrl;
    if (sourceNode.data.imageUrl) return sourceNode.data.imageUrl;
    if (sourceNode.data.generatedVideoUrl) return sourceNode.data.generatedVideoUrl;
  }
  return null;
};

const resetWorkflow = () => {
  runStatus.value = "idle";
  runProgress.value = 0;
  runningNodeId.value = null;
  nodes.value = nodes.value.map((n) => ({
    ...n,
    data: { ...n.data, status: "idle", outputData: null },
  }));
};

// ============================================================
// 连接验证：通过 isValidConnection 阻止非法连接
// ============================================================
const { onConnect, addEdges: vueFlowAddEdges } = useVueFlow();

// 全局连接验证函数
const isValidConnectionFn = (connection: any) => {
  const sourceNode = nodes.value.find((n) => n.id === connection.source);
  const targetNode = nodes.value.find((n) => n.id === connection.target);
  if (!sourceNode || !targetNode) return false;

  const sourceDef = nodeDefinitions.find((d) => d.id === sourceNode.nodeDefId);
  const targetDef = nodeDefinitions.find((d) => d.id === targetNode.nodeDefId);
  if (!sourceDef || !targetDef) return false;

  const sourcePort = sourceDef.outputs.find(
    (p) => p.id === connection.sourceHandle,
  );
  const targetPort = targetDef.inputs.find(
    (p) => p.id === connection.targetHandle,
  );

  if (!sourcePort || !targetPort) return false;
  return sourcePort.type === targetPort.type;
};

// 验证连接是否有效（用于提示）
const validateConnection = (
  params: any,
): { valid: boolean; message?: string } => {
  const sourceNode = nodes.value.find((n) => n.id === params.source);
  const targetNode = nodes.value.find((n) => n.id === params.target);
  if (!sourceNode || !targetNode) return { valid: false };

  const sourceDef = nodeDefinitions.find((d) => d.id === sourceNode.nodeDefId);
  const targetDef = nodeDefinitions.find((d) => d.id === targetNode.nodeDefId);
  if (!sourceDef || !targetDef) return { valid: false };

  const sourcePort = sourceDef.outputs.find(
    (p) => p.id === params.sourceHandle,
  );
  const targetPort = targetDef.inputs.find((p) => p.id === params.targetHandle);

  if (!sourcePort || !targetPort) return { valid: false };
  if (sourcePort.type !== targetPort.type) {
    return {
      valid: false,
      message: `数据类型不匹配：${sourceDef.name} 输出「${sourcePort.label}」无法连接到 ${targetDef.name} 的「${targetPort.label}」输入`,
    };
  }
  return { valid: true };
};

onConnect((params: any) => {
  const result = validateConnection(params);
  if (!result.valid) {
    if (result.message) {
      ElMessage.error(result.message);
    }
    return;
  }
  const sourceNode = nodes.value.find((n) => n.id === params.source);
  const targetNode = nodes.value.find((n) => n.id === params.target);
  if (!sourceNode || !targetNode) return;
  const sourceDef = nodeDefinitions.find((d) => d.id === sourceNode.nodeDefId);
  const targetDef = nodeDefinitions.find((d) => d.id === targetNode.nodeDefId);
  if (!sourceDef || !targetDef) return;
  const sourcePort = sourceDef.outputs.find(
    (p) => p.id === params.sourceHandle,
  );
  const targetPort = targetDef.inputs.find((p) => p.id === params.targetHandle);
  if (!sourcePort || !targetPort) return;
  const color = DATA_TYPE_COLORS[sourcePort.type];
  vueFlowAddEdges([
    {
      id: `e-${params.source}-${params.target}-${Date.now()}`,
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      animated: true,
      style: { stroke: color, strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color },
      data: { dataType: sourcePort.type },
    },
  ]);
  ElMessage.success(`已连接：${sourceDef.name} → ${targetDef.name}`);
});

// ============================================================
// 从节点库拖放到画布
// ============================================================
const onDragStart = (event: DragEvent, defId: string) => {
  if (!event.dataTransfer) return;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("node-def-id", defId);
};

const onDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
};

const getDefaultNodeData = (defId: string): NodeData => {
  const base: NodeData = { status: "idle", outputData: null };
  if (defId === "product-image") base.imageUrl = "";
  if (defId === "product-text") base.textContent = "";
  if (defId === "style-filter") base.filterPreset = "自然";
  if (defId === "text-add") {
    base.textContentNode = "";
    base.textPosition = "center";
  }
  if (defId === "smart-crop") base.cropAspect = "1:1";
  if (defId === "ai-image-gen") {
    base.aiImageModel = "标准";
    base.aiImageSize = "1024×1024";
  }
  if (defId === "ai-video-gen") {
    base.aiVideoDuration = "4秒";
    base.aiVideoMotion = "自动";
  }
  return base;
};

const onDrop = (event: DragEvent) => {
  event.preventDefault();
  if (!event.dataTransfer) return;
  const defId = event.dataTransfer.getData("node-def-id");
  if (!defId) return;
  const def = nodeDefinitions.find((d) => d.id === defId);
  if (!def) return;
  const wrapper = (event.target as HTMLElement).closest(".vue-flow-wrapper");
  if (!wrapper) return;
  const vueFlowEl = wrapper.querySelector(".vue-flow") as HTMLElement;
  if (!vueFlowEl) return;
  const rect = vueFlowEl.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  nodes.value = [
    ...nodes.value,
    {
      id: makeNodeId(),
      type: "custom",
      label: def.name,
      nodeDefId: def.id,
      position: { x, y },
      data: getDefaultNodeData(def.id),
    },
  ];
  ElMessage.success(`已添加：${def.name}`);
};

// ============================================================
// 节点 / 边点击
// ============================================================
const selectedNode = ref<VueFlowNode | null>(null);

// 智能连线推荐面板
const showConnectionPanel = ref(false);
const connectionPanelPos = ref({ x: 0, y: 0 });
const compatibleNodes = ref<NodeDef[]>([]);
const pendingConnection = ref<{
  sourceId: string;
  sourceHandle: string;
} | null>(null);

const handleNodeClick = (event: any) => {
  const fullNode = nodes.value.find((n) => n.id === event.node.id);
  if (fullNode) selectedNode.value = fullNode;
};

const closePanel = () => {
  selectedNode.value = null;
};

const deleteNode = () => {
  if (!selectedNode.value) return;
  const id = selectedNode.value.id;
  nodes.value = nodes.value.filter((n) => n.id !== id);
  edges.value = edges.value.filter((e) => e.source !== id && e.target !== id);
  selectedNode.value = null;
  ElMessage.info("节点已删除");
};

const onEdgeClick = (event: any) => {
  edges.value = edges.value.filter((e) => e.id !== event.edge.id);
  ElMessage.info("连接已删除");
};

// 开始连线时显示兼容节点面板
const onConnectStart = (params: any) => {
  const nodeId = params.nodeId;
  const handleId = params.handleId;
  if (!nodeId || !handleId) return;
  const sourceNode = nodes.value.find((n) => n.id === nodeId);
  if (!sourceNode) return;
  const sourceDef = nodeDefinitions.find((d) => d.id === sourceNode.nodeDefId);
  if (!sourceDef) return;
  const sourcePort = sourceDef.outputs.find((p) => p.id === handleId);
  if (!sourcePort) return;

  // 找到所有可以连接的节点
  const compatible = nodeDefinitions.filter((def) => {
    return def.inputs.some((input) => input.type === sourcePort.type);
  });

  if (compatible.length > 0) {
    pendingConnection.value = { sourceId: nodeId, sourceHandle: handleId };
    compatibleNodes.value = compatible;

    // 面板位置固定在源节点右侧
    connectionPanelPos.value = {
      x: sourceNode.position.x + 220,
      y: sourceNode.position.y - 50,
    };
    showConnectionPanel.value = true;
  }
};

// 添加节点并连接到源节点
const addNodeAndConnect = (def: NodeDef) => {
  if (!pendingConnection.value) return;

  const sourceNode = nodes.value.find(
    (n) => n.id === pendingConnection.value!.sourceId,
  );
  if (!sourceNode) return;
  const sourceDef = nodeDefinitions.find((d) => d.id === sourceNode.nodeDefId);
  if (!sourceDef) return;

  // 计算新节点位置
  const sourcePos = sourceNode.position;
  const newX = sourcePos.x + 250;
  const newY = sourcePos.y + (Math.random() - 0.5) * 100;

  // 创建新节点
  const newNodeId = makeNodeId();
  const newNode: VueFlowNode = {
    id: newNodeId,
    type: "custom",
    label: def.name,
    nodeDefId: def.id,
    position: { x: newX, y: newY },
    data: getDefaultNodeData(def.id),
  };
  nodes.value = [...nodes.value, newNode];

  // 创建连接 - 直接添加到 edges.value
  const sourcePort = sourceDef.outputs.find(
    (p) => p.id === pendingConnection.value!.sourceHandle,
  );
  if (sourcePort) {
    const targetPort = def.inputs.find((p) => p.type === sourcePort.type);
    if (targetPort) {
      const color = DATA_TYPE_COLORS[sourcePort.type];
      const newEdge: VueFlowEdge = {
        id: `e-${pendingConnection.value!.sourceId}-${newNodeId}-${Date.now()}`,
        source: pendingConnection.value!.sourceId,
        target: newNodeId,
        sourceHandle: pendingConnection.value!.sourceHandle,
        targetHandle: targetPort.id,
        animated: true,
        style: { stroke: color, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color },
        data: { dataType: sourcePort.type },
      };
      edges.value = [...edges.value, newEdge];
      ElMessage.success(`已添加并连接：${sourceDef.name} → ${def.name}`);
    }
  }

  // 关闭面板
  showConnectionPanel.value = false;
  pendingConnection.value = null;
};

// 关闭推荐面板
const closeConnectionPanel = () => {
  showConnectionPanel.value = false;
  pendingConnection.value = null;
};

// ============================================================
// 属性面板
// ============================================================
const selectedNodeDef = computed(() => {
  if (!selectedNode.value) return null;
  return (
    nodeDefinitions.find((d) => d.id === selectedNode.value!.nodeDefId) || null
  );
});

const updateNodeData = (key: keyof NodeData, value: any) => {
  if (!selectedNode.value) return;
  const updated = {
    ...selectedNode.value,
    data: { ...selectedNode.value.data, [key]: value },
  };
  nodes.value = nodes.value.map((n) => (n.id === updated.id ? updated : n));
  selectedNode.value = updated;
};

// ============================================================
// 图片上传
// ============================================================
const imageInputRef = ref<HTMLInputElement | null>(null);
const triggerImageUpload = () => imageInputRef.value?.click();

const onImageSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !selectedNode.value) return;
  const url = URL.createObjectURL(file);
  updateNodeData("imageUrl", url);
  updateNodeData("outputData", { type: "image", label: "已上传图片" });
  updateNodeData("status", "done");
  ElMessage.success("图片上传成功");
};

// 下载图片
const downloadImage = (node: VueFlowNode) => {
  const url = node.data.generatedImageUrl || node.data.imageUrl;
  if (!url) {
    ElMessage.warning("暂无图片可下载");
    return;
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = `生成图片_${Date.now()}.png`;
  a.click();
  ElMessage.success("图片下载中...");
};

// ============================================================
// 假数据：已生成的图片
// ============================================================
interface GeneratedImage {
  id: string;
  url: string;
  title: string;
  createdAt: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  roas: number;
  dailyData: { date: string; impressions: number; clicks: number; spend: number }[];
}

const generatedImages = ref<GeneratedImage[]>([
  {
    id: "img-1",
    url: "https://picsum.photos/seed/wf1/400/300",
    title: "产品图-A 款",
    createdAt: "2026-07-01",
    impressions: 124500,
    clicks: 3890,
    ctr: 3.12,
    spend: 246.8,
    roas: 4.6,
    dailyData: Array.from({ length: 15 }, (_, i) => ({
      date: `${7 - i + 1}日`,
      impressions: Math.floor(7000 + Math.random() * 3000),
      clicks: Math.floor(200 + Math.random() * 100),
      spend: parseFloat((15 + Math.random() * 5).toFixed(2)),
    })),
  },
  {
    id: "img-2",
    url: "https://picsum.photos/seed/wf2/400/300",
    title: "产品图-B 款",
    createdAt: "2026-06-28",
    impressions: 98300,
    clicks: 2560,
    ctr: 2.6,
    spend: 198.5,
    roas: 3.9,
    dailyData: Array.from({ length: 15 }, (_, i) => ({
      date: `${7 - i + 1}日`,
      impressions: Math.floor(5000 + Math.random() * 4000),
      clicks: Math.floor(150 + Math.random() * 80),
      spend: parseFloat((12 + Math.random() * 4).toFixed(2)),
    })),
  },
  {
    id: "img-3",
    url: "https://picsum.photos/seed/wf3/400/300",
    title: "促销主图",
    createdAt: "2026-06-25",
    impressions: 215000,
    clicks: 8600,
    ctr: 4.0,
    spend: 420.0,
    roas: 5.8,
    dailyData: Array.from({ length: 15 }, (_, i) => ({
      date: `${7 - i + 1}日`,
      impressions: Math.floor(12000 + Math.random() * 5000),
      clicks: Math.floor(500 + Math.random() * 200),
      spend: parseFloat((25 + Math.random() * 10).toFixed(2)),
    })),
  },
  {
    id: "img-4",
    url: "https://picsum.photos/seed/wf4/400/300",
    title: "场景图-客厅",
    createdAt: "2026-06-20",
    impressions: 67800,
    clicks: 1780,
    ctr: 2.62,
    spend: 135.6,
    roas: 3.2,
    dailyData: Array.from({ length: 15 }, (_, i) => ({
      date: `${7 - i + 1}日`,
      impressions: Math.floor(4000 + Math.random() * 2000),
      clicks: Math.floor(100 + Math.random() * 50),
      spend: parseFloat((8 + Math.random() * 3).toFixed(2)),
    })),
  },
]);

const selectedImage = ref<GeneratedImage | null>(null);
const showGalleryPanel = ref(false);
const chartRef = ref<HTMLDivElement | null>(null);

const openImageDetail = (img: GeneratedImage) => {
  selectedImage.value = img;
  showGalleryPanel.value = true;
  setTimeout(() => renderChart(), 100);
};

const closeGalleryPanel = () => {
  showGalleryPanel.value = false;
  selectedImage.value = null;
};

const renderChart = () => {
  if (!chartRef.value || !selectedImage.value) return;
  const chart = echarts.init(chartRef.value);
  const data = selectedImage.value.dailyData;

  chart.setOption({
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(20, 20, 35, 0.92)",
      borderColor: "rgba(78, 205, 196, 0.3)",
      textStyle: { color: "#e2e8f0", fontSize: 12 },
    },
    legend: {
      data: ["曝光量", "点击量", "消耗(元)"],
      top: 0,
      textStyle: { color: "#94a3b8", fontSize: 11 },
      inactiveColor: "#475569",
    },
    grid: { left: "8%", right: "5%", top: 40, bottom: 20, containLabel: true },
    xAxis: {
      type: "category",
      data: data.map((d) => d.date),
      axisLine: { lineStyle: { color: "#334155" } },
      axisLabel: { color: "#94a3b8", fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.1)" } },
        axisLabel: { color: "#94a3b8", fontSize: 10 },
      },
      {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: "#94a3b8", fontSize: 10, formatter: "¥{value}" },
      },
    ],
    series: [
      {
        name: "曝光量",
        type: "line",
        data: data.map((d) => d.impressions),
        smooth: true,
        lineStyle: { color: "#4ecdc4", width: 2 },
        itemStyle: { color: "#4ecdc4" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(78, 205, 196, 0.25)" },
            { offset: 1, color: "rgba(78, 205, 196, 0.02)" },
          ]),
        },
      },
      {
        name: "点击量",
        type: "line",
        yAxisIndex: 0,
        data: data.map((d) => d.clicks),
        smooth: true,
        lineStyle: { color: "#a78bfa", width: 2 },
        itemStyle: { color: "#a78bfa" },
      },
      {
        name: "消耗(元)",
        type: "bar",
        yAxisIndex: 1,
        data: data.map((d) => d.spend),
        barWidth: "40%",
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#60a5fa" },
            { offset: 1, color: "rgba(96, 165, 250, 0.5)" },
          ]),
          borderRadius: [3, 3, 0, 0],
        },
      },
    ],
  });
};

const formatNum = (n: number) => {
  if (n >= 10000) return (n / 10000).toFixed(1) + "w";
  return n.toLocaleString();
};

// 下载视频
const downloadVideo = (node: VueFlowNode) => {
  const url = node.data.generatedVideoUrl;
  if (!url) {
    ElMessage.warning("暂无视频可下载");
    return;
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = `生成视频_${Date.now()}.mp4`;
  a.click();
  ElMessage.success("视频下载中...");
};
</script>
<template>
  <div class="canvas-view">
    <!-- ===================== 左侧节点库 ===================== -->
    <aside class="side-panel card">
      <div class="panel-header">
        <h3>节点库</h3>
        <span class="node-count">{{ nodeDefinitions.length }} 个节点</span>
      </div>

      <div class="panel-content">
        <div
          v-for="(defs, groupTitle) in nodeGroupMap"
          :key="groupTitle"
          class="node-group"
        >
          <div class="group-title">{{ groupTitle }}</div>
          <div class="node-list">
            <div
              v-for="def in defs"
              :key="def.id"
              class="node-item"
              draggable="true"
              @dragstart="onDragStart($event, def.id)"
            >
              <div
                class="node-icon"
                :style="{
                  background: `${def.color}15`,
                  borderColor: `${def.color}40`,
                }"
              >
                <span :style="{ color: def.color }">{{ def.name[0] }}</span>
              </div>
              <div class="node-info">
                <span class="node-name">{{ def.name }}</span>
                <span class="node-desc">{{ def.desc }}</span>
              </div>
              <div class="type-badges">
                <span
                  v-if="def.inputs.length"
                  class="type-badge"
                  :style="{
                    background: `${DATA_TYPE_COLORS[def.inputs[0].type]}15`,
                    color: DATA_TYPE_COLORS[def.inputs[0].type],
                  }"
                  >{{ DATA_TYPE_LABELS[def.inputs[0].type] }}</span
                >
                <span
                  v-if="def.outputs.length"
                  class="type-badge"
                  :style="{
                    background: `${DATA_TYPE_COLORS[def.outputs[0].type]}15`,
                    color: DATA_TYPE_COLORS[def.outputs[0].type],
                  }"
                  >{{ DATA_TYPE_LABELS[def.outputs[0].type] }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <div class="run-info" v-if="runStatus === 'running'">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: runProgress + '%' }"
            ></div>
          </div>
          <span class="progress-text">执行中 {{ runProgress }}%</span>
        </div>
        <div
          class="run-cost-info"
          v-if="workflowCost > 0 && runStatus !== 'running'"
        >
          <span class="cost-label">本次消耗</span>
          <span class="cost-value">{{ workflowCost }} 积分</span>
        </div>
        <div class="run-actions">
          <button
            class="btn-outline"
            @click="resetWorkflow"
            v-if="runStatus === 'done'"
          >
            重置
          </button>
          <button
            class="btn-accent full-width"
            :class="{
              running: runStatus === 'running',
              disabled: store.credits < workflowCost && workflowCost > 0,
            }"
            @click="runWorkflow"
            :disabled="
              runStatus === 'running' ||
              (store.credits < workflowCost && workflowCost > 0)
            "
          >
            <svg
              v-if="runStatus !== 'running'"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <path d="M3 2L11 7L3 12V2Z" fill="currentColor" />
            </svg>
            <span class="spinner" v-else></span>
            {{
              runStatus === "running"
                ? "执行中..."
                : runStatus === "done"
                  ? "重新执行"
                  : "开始生成"
            }}
          </button>
        </div>
        <div
          class="balance-hint"
          v-if="workflowCost > 0 && store.credits < workflowCost"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle
              cx="6"
              cy="6"
              r="5"
              stroke="currentColor"
              stroke-width="1.2"
            />
            <path
              d="M6 4V7"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
            />
            <circle cx="6" cy="8.5" r="0.5" fill="currentColor" />
          </svg>
          积分不足，请先充值
        </div>
      </div>
    </aside>

    <!-- ===================== 画布区域 ===================== -->
    <div class="canvas-container">
      <div class="canvas-toolbar">
        <div class="toolbar-left">
          <span class="canvas-title">{{ currentDraft.name }}</span>
          <span class="canvas-status" :class="runStatus">
            <span class="status-dot"></span>
            {{
              runStatus === "idle"
                ? "未保存"
                : runStatus === "running"
                  ? `执行中 ${runProgress}%`
                  : "已完成"
            }}
          </span>
          <div
            class="workflow-cost"
            v-if="workflowCost > 0 && nodes.length > 0"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle
                cx="6"
                cy="6"
                r="5"
                stroke="currentColor"
                stroke-width="1.2"
              />
              <path
                d="M6 4V6.5L7.5 7.5"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
              />
            </svg>
            <span>预估消耗 {{ workflowCost }} 积分</span>
          </div>
        </div>
        <div class="toolbar-center">
          <div class="type-legend">
            <span
              class="legend-item"
              v-for="(color, type) in DATA_TYPE_COLORS"
              :key="type"
            >
              <span class="legend-dot" :style="{ background: color }"></span>
              {{ DATA_TYPE_LABELS[type as DataType] }}
            </span>
          </div>
        </div>
        <div class="toolbar-right">
          <button class="tool-btn" @click="ElMessage.info('撤销')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8H13M3 8L7 4M3 8L7 12"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <button class="tool-btn" @click="ElMessage.info('重做')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M13 8H3M13 8L9 4M13 8L9 12"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div class="vue-flow-wrapper" @dragover="onDragOver" @drop="onDrop">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :nodes-draggable="true"
          :connect-on-click="false"
          :node-types="nodeTypes"
          :is-valid-connection="isValidConnectionFn"
          @node-click="handleNodeClick"
          @edge-click="onEdgeClick"
          @connect-start="onConnectStart"
          fit-view-on-init
          :default-edge-options="{ animated: true, style: { strokeWidth: 2 } }"
          style="height: 100%; width: 100%"
        >
          <Background pattern-color="rgba(78, 205, 196, 0.04)" :gap="24" />
          <Controls />
          <MiniMap
            :node-color="
              (node: any) => {
                const def = nodeDefinitions.find(
                  (d) => d.id === node.nodeDefId,
                );
                return def?.color || '#4ecdc4';
              }
            "
            mask-color="rgba(247, 248, 250, 0.9)"
          />
        </VueFlow>

        <!-- 全局生成动画提示 -->
        <Transition name="generating-fade">
          <div v-if="runStatus === 'running'" class="generating-overlay">
            <div class="generating-content">
              <div class="generating-spinner">
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
              </div>
              <div class="generating-text">正在生成中...</div>
              <div class="generating-progress">{{ runProgress }}%</div>
            </div>
          </div>
        </Transition>

        <!-- 智能连线推荐面板 -->
        <Transition name="fade">
          <div
            v-if="showConnectionPanel"
            class="connection-panel"
            :style="{
              left: connectionPanelPos.x + 'px',
              top: connectionPanelPos.y + 'px',
            }"
          >
            <div class="connection-panel__header">
              <span class="connection-panel__title">可连接的节点</span>
              <button
                class="connection-panel__close"
                @click="closeConnectionPanel"
              >
                ×
              </button>
            </div>
            <div class="connection-panel__list">
              <div
                v-for="def in compatibleNodes"
                :key="def.id"
                class="connection-panel__item"
                @click="addNodeAndConnect(def)"
              >
                <div
                  class="item-icon"
                  :style="{
                    background: def.color + '20',
                    borderColor: def.color + '40',
                  }"
                >
                  <span :style="{ color: def.color }">{{ def.name[0] }}</span>
                </div>
                <div class="item-info">
                  <span class="item-name">{{ def.name }}</span>
                  <span class="item-desc">{{ def.desc }}</span>
                </div>
                <div class="item-arrow">+</div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 多人协作面板 -->
      <transition name="slide">
        <aside v-if="showCollabPanel" class="properties-panel card">
          <div class="panel-header">
            <h3>协作管理</h3>
            <button class="close-btn" @click="showCollabPanel = false">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4L12 12M4 12L12 4"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          <div class="panel-content">
            <div class="property-section">
              <div class="member-header">
                <div>
                  <div class="property-label">成员与权限</div>
                  <div class="property-desc">
                    可消耗点数：可运行并扣减素材积分；仅查看素材：仅浏览，不可运行
                  </div>
                </div>
                <div class="role-badge" :class="currentUserRole">
                  {{ roleLabels[currentUserRole] }}
                </div>
              </div>

              <div class="member-list">
                <div
                  v-for="member in members"
                  :key="member.userId"
                  class="member-item"
                >
                  <div class="member-info">
                    <div class="member-avatar">{{ member.name[0] }}</div>
                    <div class="member-meta">
                      <span class="member-name">{{ member.name }}</span>
                      <span class="member-email">{{ member.email }}</span>
                    </div>
                  </div>
                  <div class="member-actions">
                    <span class="role-tag" :class="member.role">{{
                      roleLabels[member.role]
                    }}</span>
                    <el-select
                      v-if="canEditRole(member)"
                      :model-value="member.role"
                      @update:model-value="
                        updateMemberRole(member.userId, $event)
                      "
                      size="small"
                      style="width: 160px"
                    >
                      <el-option label="可消耗点数" value="consumer" />
                      <el-option label="仅查看素材" value="viewer" />
                    </el-select>
                    <button
                      v-if="canRemoveMember(member)"
                      class="member-remove"
                      @click="removeMember(member.userId)"
                    >
                      移除
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="divider"></div>

            <div class="property-section">
              <div class="invite-row">
                <input
                  v-model="inviteEmail"
                  class="invite-input"
                  placeholder="输入邮箱邀请成员"
                />
                <el-select
                  v-model="inviteRole"
                  size="small"
                  style="width: 160px"
                >
                  <el-option label="可消耗点数" value="consumer" />
                  <el-option label="仅查看素材" value="viewer" />
                </el-select>
                <button class="btn-accent invite-btn" @click="inviteMember">
                  邀请
                </button>
              </div>
              <div class="permission-hint">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle
                    cx="7"
                    cy="7"
                    r="6"
                    stroke="currentColor"
                    stroke-width="1.2"
                  />
                  <path
                    d="M7 6.5v3.5M7 5v.75"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-linecap="round"
                  />
                </svg>
                <span
                  >owner 拥有全部权限，consumer 可消耗点数，viewer
                  仅查看素材</span
                >
              </div>
            </div>
          </div>
        </aside>
      </transition>

      <!-- 底部草稿管理条 -->
      <div class="draft-bar">
        <div class="draft-bar__left">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect
              x="1.5"
              y="2.5"
              width="11"
              height="9"
              rx="1.5"
              stroke="currentColor"
              stroke-width="1.2"
            />
            <path
              d="M4 6H10M4 8.5H8"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
            />
          </svg>
          <span class="draft-bar__label">草稿</span>
        </div>

        <div class="draft-list">
          <button
            v-for="draft in drafts"
            :key="draft.id"
            class="draft-chip"
            :class="{ active: currentDraftId === draft.id }"
            @click="switchDraft(draft.id)"
          >
            <span class="draft-chip__name">{{ draft.name }}</span>
            <span
              v-if="drafts.length > 1"
              class="draft-chip__del"
              @click.stop="deleteDraft(draft.id)"
              >×</span
            >
          </button>
        </div>

        <div class="draft-bar__right">
          <button
            class="draft-action-btn"
            @click="createDraft"
            title="新建草稿"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 2V12M2 7H12"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <button
            class="draft-action-btn primary"
            @click="saveDraft"
            title="保存草稿"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M11 12H3C2.44772 12 2 11.5523 2 11V3C2 2.44772 2.44772 2 3 2H8L12 6V11C12 11.5523 11.5523 12 11 12Z"
                stroke="currentColor"
                stroke-width="1.2"
              />
              <path
                d="M4 12V8H10V12"
                stroke="currentColor"
                stroke-width="1.2"
              />
            </svg>
            保存
          </button>
          <button
            class="draft-action-btn"
            @click="showSharePanel = true"
            title="共享"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M5 7C5 5.89543 5.89543 5 7 5C8.10457 5 9 5.89543 9 7C9 8.10457 8.10457 9 7 9"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
              />
              <path
                d="M11.5 7C11.5 4.79086 9.70914 3 7.5 3C5.29086 3 3.5 4.79086 3.5 7C3.5 9.20914 5.29086 11 7.5 11"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
              />
              <path
                d="M3 11C2.44772 11 2 11.4477 2 12C2 12.5523 2.44772 13 3 13H11C11.5523 13 12 12.5523 12 12C12 11.4477 11.5523 11 11 11"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <button
            class="draft-action-btn"
            @click="goToPermissions"
            title="权限管理"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M12 7C12 9.20914 10.2091 11 8 11C5.79086 11 4 9.20914 4 7C4 4.79086 5.79086 3 8 3C10.2091 3 12 4.79086 12 7Z"
                stroke="currentColor"
                stroke-width="1.2"
              />
              <path
                d="M8 7V10"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
              />
              <path
                d="M8 5.5V5.51"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- ===================== 底部生成图库面板 ===================== -->
      <transition name="gallery-slide">
        <div v-if="showGalleryPanel" class="gallery-panel card">
          <div class="gallery-panel__header">
            <div class="gallery-panel__title-row">
              <h3>数据详情</h3>
              <span class="gallery-panel__sub">近 15 日趋势</span>
            </div>
            <button class="close-btn" @click="closeGalleryPanel">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="gallery-panel__body">
            <div class="gallery-panel__left">
              <img :src="selectedImage?.url" :alt="selectedImage?.title" class="gallery-detail-img" />
              <div class="gallery-detail-meta">
                <span class="gallery-detail-title">{{ selectedImage?.title }}</span>
                <span class="gallery-detail-date">生成于 {{ selectedImage?.createdAt }}</span>
              </div>
              <div class="gallery-thumb-list">
                <img
                  v-for="img in generatedImages"
                  :key="img.id"
                  :src="img.url"
                  class="gallery-thumb-item"
                  :class="{ active: selectedImage?.id === img.id }"
                  @click="openImageDetail(img)"
                />
              </div>
            </div>

            <div class="gallery-panel__right">
              <div class="stats-grid">
                <div class="stat-card">
                  <span class="stat-label">曝光量</span>
                  <span class="stat-value">{{ formatNum(selectedImage?.impressions || 0) }}</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">点击量</span>
                  <span class="stat-value">{{ formatNum(selectedImage?.clicks || 0) }}</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">点击率 CTR</span>
                  <span class="stat-value accent">{{ (selectedImage?.ctr || 0).toFixed(2) }}%</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">广告消耗</span>
                  <span class="stat-value">¥{{ (selectedImage?.spend || 0).toFixed(2) }}</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">ROAS</span>
                  <span class="stat-value" :class="{ green: (selectedImage?.roas || 0) >= 4, red: (selectedImage?.roas || 0) < 3 }">
                    {{ (selectedImage?.roas || 0).toFixed(1) }}x
                  </span>
                </div>
              </div>

              <div ref="chartRef" class="chart-container"></div>
            </div>
          </div>
        </div>
      </transition>

      <!-- 底部生成图库入口 -->
      <div v-if="!showGalleryPanel" class="gallery-bar" @click="showGalleryPanel = true">
        <div class="gallery-bar__left">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.2"/>
            <circle cx="4.5" cy="4.5" r="1" fill="currentColor"/>
            <path d="M1 10L4 7L6 9L8.5 6.5L13 11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>查看生成图库</span>
          <span class="gallery-bar__badge">{{ generatedImages.length }} 张</span>
        </div>
        <div class="gallery-bar__thumbs">
          <img v-for="img in generatedImages.slice(0, 5)" :key="img.id" :src="img.url" class="gallery-bar__thumb" />
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="gallery-bar__arrow">
          <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>

    <!-- ===================== 右侧属性面板 ===================== -->
    <transition name="slide">
      <aside v-if="selectedNode" class="properties-panel card">
        <div class="panel-header">
          <h3>节点属性</h3>
          <button class="close-btn" @click="closePanel">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4L12 12M4 12L12 4"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        <div class="panel-content" v-if="selectedNodeDef">
          <!-- 节点基本信息 -->
          <div class="property-section">
            <div class="node-header-info">
              <div
                class="node-icon-lg"
                :style="{
                  background: `${selectedNodeDef.color}15`,
                  borderColor: `${selectedNodeDef.color}30`,
                }"
              >
                <span :style="{ color: selectedNodeDef.color }">{{
                  selectedNodeDef.name[0]
                }}</span>
              </div>
              <div>
                <div class="node-title-lg">{{ selectedNodeDef.name }}</div>
                <div class="node-desc-lg">{{ selectedNodeDef.desc }}</div>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <!-- 产品图片：上传 -->
          <template v-if="selectedNodeDef.id === 'product-image'">
            <div class="property-section">
              <label class="property-label">上传图片</label>
              <input
                ref="imageInputRef"
                type="file"
                accept="image/*"
                style="display: none"
                @change="onImageSelected"
              />
              <div class="image-upload-area" @click="triggerImageUpload">
                <img
                  v-if="selectedNode.data.imageUrl"
                  :src="selectedNode.data.imageUrl"
                  class="image-preview"
                />
                <div v-else class="upload-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                    <path
                      d="M17 8L12 3L7 8"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M12 3V15"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                  <span>点击上传图片</span>
                </div>
              </div>
            </div>
          </template>

          <!-- 产品描述：文字输入 -->
          <template v-else-if="selectedNodeDef.id === 'product-text'">
            <div class="property-section">
              <label class="property-label">产品描述</label>
              <textarea
                class="property-textarea"
                :value="selectedNode.data.textContent"
                @input="
                  updateNodeData(
                    'textContent',
                    ($event.target as HTMLTextAreaElement).value,
                  )
                "
                placeholder="请输入产品描述，如：简约风格的白色手表，适合商务场合..."
                rows="4"
              ></textarea>
            </div>
          </template>

          <!-- 风格滤镜：选择组合 -->
          <template v-else-if="selectedNodeDef.id === 'style-filter'">
            <div class="property-section">
              <label class="property-label">滤镜组合</label>
              <div class="filter-grid">
                <button
                  v-for="preset in [
                    '自然',
                    '复古',
                    '胶片',
                    '黑白',
                    '暖调',
                    '冷调',
                    'HDR',
                    '赛博朋克',
                  ]"
                  :key="preset"
                  class="filter-btn"
                  :class="{ active: selectedNode.data.filterPreset === preset }"
                  @click="updateNodeData('filterPreset', preset)"
                >
                  {{ preset }}
                </button>
              </div>
            </div>
          </template>

          <!-- 文字添加：内容 + 位置 -->
          <template v-else-if="selectedNodeDef.id === 'text-add'">
            <div class="property-section">
              <label class="property-label">文字内容</label>
              <textarea
                class="property-textarea"
                :value="selectedNode.data.textContentNode"
                @input="
                  updateNodeData(
                    'textContentNode',
                    ($event.target as HTMLTextAreaElement).value,
                  )
                "
                placeholder="请输入要添加的文字..."
                rows="2"
              ></textarea>
            </div>
            <div class="property-section">
              <label class="property-label">添加位置</label>
              <div class="position-grid">
                <button
                  v-for="pos in [
                    '左上',
                    '上',
                    '右上',
                    '左',
                    '居中',
                    '右',
                    '左下',
                    '下',
                    '右下',
                  ]"
                  :key="pos"
                  class="pos-btn"
                  :class="{ active: selectedNode.data.textPosition === pos }"
                  @click="updateNodeData('textPosition', pos)"
                >
                  {{ pos }}
                </button>
              </div>
            </div>
          </template>

          <!-- 智能裁剪：比例 -->
          <template v-else-if="selectedNodeDef.id === 'smart-crop'">
            <div class="property-section">
              <label class="property-label">裁剪比例</label>
              <div class="aspect-grid">
                <button
                  v-for="ratio in ['1:1', '4:3', '16:9', '9:16', '3:4', '自由']"
                  :key="ratio"
                  class="aspect-btn"
                  :class="{ active: selectedNode.data.cropAspect === ratio }"
                  @click="updateNodeData('cropAspect', ratio)"
                >
                  {{ ratio }}
                </button>
              </div>
            </div>
          </template>

          <!-- AI 图片生成：模型 + 尺寸 -->
          <template v-else-if="selectedNodeDef.id === 'ai-image-gen'">
            <div class="property-section">
              <label class="property-label">生成模型</label>
              <select
                class="property-select"
                :value="selectedNode.data.aiImageModel"
                @change="
                  updateNodeData(
                    'aiImageModel',
                    ($event.target as HTMLSelectElement).value,
                  )
                "
              >
                <option>快速</option>
                <option>标准</option>
                <option>高清</option>
              </select>
            </div>
            <div class="property-section">
              <label class="property-label">输出尺寸</label>
              <select
                class="property-select"
                :value="selectedNode.data.aiImageSize"
                @change="
                  updateNodeData(
                    'aiImageSize',
                    ($event.target as HTMLSelectElement).value,
                  )
                "
              >
                <option>512×512</option>
                <option selected>1024×1024</option>
                <option>1024×1792</option>
                <option>1792×1024</option>
              </select>
            </div>
          </template>

          <!-- AI 视频生成：时长 + 运动 -->
          <template v-else-if="selectedNodeDef.id === 'ai-video-gen'">
            <div class="property-section">
              <label class="property-label">视频时长</label>
              <div class="duration-grid">
                <button
                  v-for="dur in ['2秒', '4秒', '6秒', '10秒']"
                  :key="dur"
                  class="duration-btn"
                  :class="{ active: selectedNode.data.aiVideoDuration === dur }"
                  @click="updateNodeData('aiVideoDuration', dur)"
                >
                  {{ dur }}
                </button>
              </div>
            </div>
            <div class="property-section">
              <label class="property-label">运动模式</label>
              <div class="motion-grid">
                <button
                  v-for="motion in ['自动', '平滑', '运镜', '静态']"
                  :key="motion"
                  class="motion-btn"
                  :class="{
                    active: selectedNode.data.aiVideoMotion === motion,
                  }"
                  @click="updateNodeData('aiVideoMotion', motion)"
                >
                  {{ motion }}
                </button>
              </div>
            </div>
          </template>

          <!-- 导出图片节点 -->
          <template v-else-if="selectedNodeDef.id === 'export-image'">
            <div class="property-section">
              <div class="export-hint">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 14V2M10 14L6 10M10 14L14 10"
                    stroke="#f59e0b"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M2 18H18"
                    stroke="#f59e0b"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
                <span>点击「开始生成」后自动导出成品</span>
              </div>
            </div>
            <div class="property-section">
              <button
                class="download-btn"
                :disabled="
                  !selectedNode.data.generatedImageUrl &&
                  !selectedNode.data.imageUrl
                "
                @click="downloadImage(selectedNode!)"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 11V2M8 11L4 7M8 11L12 7"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M2 14H14"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
                下载图片
              </button>
            </div>
            <div
              v-if="
                selectedNode.data.generatedImageUrl ||
                selectedNode.data.imageUrl
              "
              class="property-section"
            >
              <label class="property-label">预览</label>
              <div class="image-preview-box">
                <img
                  :src="
                    selectedNode.data.generatedImageUrl ||
                    selectedNode.data.imageUrl
                  "
                  alt="生成图片"
                />
              </div>
            </div>
          </template>

          <!-- 导出视频节点 -->
          <template v-else-if="selectedNodeDef.id === 'export-video'">
            <div class="property-section">
              <div class="export-hint">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 14V2M10 14L6 10M10 14L14 10"
                    stroke="#f59e0b"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M2 18H18"
                    stroke="#f59e0b"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
                <span>点击「开始生成」后自动导出成品</span>
              </div>
            </div>
            <div class="property-section">
              <button
                class="download-btn"
                :disabled="!selectedNode.data.generatedVideoUrl"
                @click="downloadVideo(selectedNode!)"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 11V2M8 11L4 7M8 11L12 7"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M2 14H14"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
                下载视频
              </button>
            </div>
            <div
              v-if="selectedNode.data.generatedVideoUrl"
              class="property-section"
            >
              <label class="property-label">预览</label>
              <div class="video-preview-box">
                <video
                  :src="selectedNode.data.generatedVideoUrl"
                  controls
                ></video>
              </div>
            </div>
          </template>

          <!-- 通用信息 -->
          <template v-if="selectedNodeDef.category !== 'output'">
            <div class="divider"></div>
            <div class="property-section">
              <label class="property-label">运行状态</label>
              <div class="status-badge" :class="selectedNode.data.status">
                <span v-if="selectedNode.data.status === 'running'"
                  >执行中</span
                >
                <span v-else-if="selectedNode.data.status === 'done'"
                  >已完成</span
                >
                <span v-else>等待中</span>
              </div>
            </div>
          </template>

          <div class="divider"></div>

          <!-- 端口信息 -->
          <div class="property-section">
            <label class="property-label">输入端口</label>
            <div class="ports-list">
              <div
                v-for="port in selectedNodeDef.inputs"
                :key="port.id"
                class="port-row"
              >
                <span class="port-name">{{ port.label }}</span>
                <span
                  class="type-tag"
                  :style="{
                    color: DATA_TYPE_COLORS[port.type],
                    background: `${DATA_TYPE_COLORS[port.type]}15`,
                  }"
                >
                  {{ DATA_TYPE_LABELS[port.type] }}
                </span>
              </div>
              <div v-if="!selectedNodeDef.inputs.length" class="empty-ports">
                无（起始节点）
              </div>
            </div>
          </div>

          <div class="property-section">
            <label class="property-label">输出端口</label>
            <div class="ports-list">
              <div
                v-for="port in selectedNodeDef.outputs"
                :key="port.id"
                class="port-row"
              >
                <span class="port-name">{{ port.label }}</span>
                <span
                  class="type-tag"
                  :style="{
                    color: DATA_TYPE_COLORS[port.type],
                    background: `${DATA_TYPE_COLORS[port.type]}15`,
                  }"
                >
                  {{ DATA_TYPE_LABELS[port.type] }}
                </span>
              </div>
              <div v-if="!selectedNodeDef.outputs.length" class="empty-ports">
                无（终点节点）
              </div>
            </div>
          </div>

          <div class="type-hint">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle
                cx="7"
                cy="7"
                r="6"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M7 6v3M7 4.5v.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <span>仅相同类型的端口可连接</span>
          </div>
        </div>

        <div class="panel-footer">
          <button class="btn-outline danger" @click="deleteNode">
            删除节点
          </button>
        </div>
      </aside>
    </transition>
  </div>
</template>

<style scoped>
.canvas-view {
  height: calc(100vh - 60px);
  display: flex;
  gap: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* ===== 侧边栏 ===== */
.side-panel,
.properties-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.node-count {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-elevated);
  padding: 2px 8px;
  border-radius: 10px;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.panel-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.side-panel {
  width: 260px;
}

/* ===== 节点库 ===== */
.node-group {
  margin-bottom: 16px;
}

.group-title {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
  padding-left: 4px;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: grab;
  transition: all 0.15s;
}

.node-item:hover {
  border-color: var(--border-accent);
  background: rgba(78, 205, 196, 0.04);
  transform: translateX(2px);
}

.node-item:active {
  cursor: grabbing;
}

.node-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-name {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.node-desc {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-badges {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
}

.type-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
  white-space: nowrap;
}

/* ===== 画布容器 ===== */
.canvas-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
}

.canvas-toolbar {
  height: 48px;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.workflow-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  background: rgba(78, 205, 196, 0.08);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 12px;
  font-size: 11px;
  color: var(--accent-cyan);
  font-weight: 500;
}

.workflow-cost svg {
  opacity: 0.8;
}

.canvas-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.canvas-status {
  font-size: 11px;
  color: var(--text-muted);
  padding: 2px 10px;
  background: var(--bg-elevated);
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.canvas-status.done {
  color: #059669;
  background: rgba(52, 211, 153, 0.08);
}

.canvas-status.running {
  color: var(--accent-cyan);
  background: rgba(78, 205, 196, 0.08);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.canvas-status.running .status-dot {
  animation: pulse-dot 1s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.toolbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.type-legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.toolbar-right {
  display: flex;
  gap: 4px;
}

.tool-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.tool-btn:hover {
  background: var(--bg-elevated);
  color: var(--accent-cyan);
}

.vue-flow-wrapper {
  flex: 1;
  position: relative;
}

/* ===== 草稿管理条 ===== */
.draft-bar {
  height: 44px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-card);
  flex-shrink: 0;
}

.draft-bar__left {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.draft-bar__label {
  font-size: 12px;
  color: var(--text-muted);
}

.draft-list {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  flex: 1;
  align-items: center;
}

.draft-list::-webkit-scrollbar {
  height: 0;
}

.draft-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--border-light);
  border-radius: 20px;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.draft-chip:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.draft-chip.active {
  background: rgba(78, 205, 196, 0.08);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
  font-weight: 600;
}

.draft-chip__del {
  font-size: 14px;
  line-height: 1;
  color: var(--text-muted);
  margin-left: 2px;
  transition: color 0.15s;
}

.draft-chip__del:hover {
  color: #dc2626;
}

.draft-bar__right {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.draft-action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.draft-action-btn:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.draft-action-btn.primary {
  background: rgba(78, 205, 196, 0.08);
  border-color: rgba(78, 205, 196, 0.3);
  color: var(--accent-cyan);
}

.draft-action-btn.primary:hover {
  background: rgba(78, 205, 196, 0.15);
}

/* ===== 协作面板 ===== */
.member-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.property-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
  line-height: 1.5;
}

.role-badge {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(78, 205, 196, 0.1);
  color: #0d9488;
  border: 1px solid rgba(78, 205, 196, 0.25);
  white-space: nowrap;
}

.role-badge.viewer {
  background: rgba(107, 114, 128, 0.08);
  color: #4b5563;
  border-color: rgba(107, 114, 128, 0.25);
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border-light);
  border-radius: 10px;
  background: var(--bg-elevated);
}

.member-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4ecdc4, #a78bfa);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.member-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.member-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.member-email {
  font-size: 12px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-tag {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(78, 205, 196, 0.1);
  color: #0d9488;
  border: 1px solid rgba(78, 205, 196, 0.25);
  white-space: nowrap;
}

.role-tag.viewer {
  background: rgba(107, 114, 128, 0.08);
  color: #4b5563;
  border-color: rgba(107, 114, 128, 0.25);
}

.member-remove {
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: #dc2626;
  font-size: 12px;
  cursor: pointer;
}

.member-remove:hover {
  background: rgba(248, 113, 113, 0.1);
  border-color: rgba(248, 113, 113, 0.35);
}

.invite-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.invite-input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-light);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.invite-input:focus {
  border-color: #4ecdc4;
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.12);
}

.invite-btn {
  padding: 9px 14px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #4ecdc4, #a78bfa);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.invite-btn:hover {
  transform: translateY(1px);
  box-shadow: 0 8px 18px rgba(78, 205, 196, 0.25);
}

.permission-hint {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(78, 205, 196, 0.06);
  border: 1px solid rgba(78, 205, 196, 0.15);
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

/* ===== 进度条 ===== */
.run-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-bar {
  height: 4px;
  background: var(--bg-elevated);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-purple));
  border-radius: 2px;
  transition: width 0.4s ease;
}

.progress-text {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

.run-cost-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(78, 205, 196, 0.06);
  border: 1px solid rgba(78, 205, 196, 0.15);
  border-radius: 8px;
  margin-bottom: 8px;
}

.cost-label {
  font-size: 12px;
  color: var(--text-muted);
}

.cost-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-cyan);
}

.balance-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 11px;
  color: #dc2626;
  padding: 6px;
  background: rgba(220, 38, 38, 0.06);
  border-radius: 6px;
  margin-top: 4px;
}

.btn-accent.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.run-actions {
  display: flex;
  gap: 8px;
}

.full-width {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-accent {
  padding: 9px 16px;
}

.btn-accent.running {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ===== 右侧属性面板 ===== */
.properties-panel {
  width: 280px;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.property-section {
  margin-bottom: 14px;
}

.property-label {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.node-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.node-icon-lg {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.node-title-lg {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 3px;
}

.node-desc-lg {
  font-size: 12px;
  color: var(--text-muted);
}

/* 图片上传 */
.image-upload-area {
  border: 1.5px dashed var(--border-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-upload-area:hover {
  border-color: var(--accent-cyan);
  background: rgba(78, 205, 196, 0.03);
}

.image-preview {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 12px;
  padding: 20px;
}

/* 文本域 */
.property-textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
  line-height: 1.6;
}

.property-textarea:focus {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.1);
}

/* 滤镜网格 */
.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.filter-btn,
.pos-btn,
.aspect-btn,
.duration-btn,
.motion-btn {
  padding: 7px 6px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.filter-btn:hover,
.pos-btn:hover,
.aspect-btn:hover,
.duration-btn:hover,
.motion-btn:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.filter-btn.active,
.pos-btn.active,
.aspect-btn.active,
.duration-btn.active,
.motion-btn.active {
  background: rgba(78, 205, 196, 0.1);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
  font-weight: 600;
}

.position-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.pos-btn {
  padding: 6px;
  font-size: 11px;
}

.aspect-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.duration-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.motion-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

/* 下拉框 */
.property-select {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.property-select:focus {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.1);
}

/* 下载按钮 */
.download-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.download-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.4);
}

.download-btn:disabled {
  background: var(--bg-elevated);
  color: var(--text-muted);
  cursor: not-allowed;
}

/* 预览区域 */
.image-preview-box {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-light);
  background: var(--bg-elevated);
}

.image-preview-box img {
  width: 100%;
  height: auto;
  display: block;
}

.video-preview-box {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-light);
  background: var(--bg-elevated);
}

.video-preview-box video {
  width: 100%;
  height: auto;
  display: block;
}

/* 导出提示 */
.export-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-secondary);
}

/* 状态徽章 */
.status-badge {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 10px;
}

.status-badge.idle {
  background: rgba(156, 163, 175, 0.1);
  color: var(--text-muted);
}

.status-badge.running {
  background: rgba(78, 205, 196, 0.1);
  color: var(--accent-cyan);
}

.status-badge.done {
  background: rgba(52, 211, 153, 0.1);
  color: #059669;
}

/* 端口列表 */
.ports-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.port-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: var(--bg-elevated);
  border-radius: 6px;
}

.port-name {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.type-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.empty-ports {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
  padding: 4px 0;
}

.type-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
  padding: 8px 10px;
  background: rgba(78, 205, 196, 0.04);
  border-radius: 6px;
  border: 1px solid rgba(78, 205, 196, 0.1);
}

.divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 12px 0;
}

.btn-outline {
  padding: 9px;
  background: transparent;
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: var(--radius-sm);
  color: #dc2626;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.btn-outline:hover {
  background: rgba(248, 113, 113, 0.06);
  border-color: #dc2626;
}

.btn-outline.danger {
  width: 100%;
}

/* ===== 过渡动画 ===== */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* ===== Vue Flow 覆盖 ===== */
:deep(.vue-flow__node) {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  box-shadow: none !important;
}

:deep(.vue-flow__edge-path) {
  stroke-width: 2;
}

/* ===== 智能连线推荐面板 ===== */
.connection-panel {
  position: absolute;
  z-index: 100;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  min-width: 220px;
  max-width: 280px;
  overflow: hidden;
}

.connection-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-subtle);
}

.connection-panel__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.connection-panel__close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
}

.connection-panel__close:hover {
  color: var(--text-primary);
}

.connection-panel__list {
  max-height: 300px;
  overflow-y: auto;
  padding: 6px;
}

.connection-panel__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.connection-panel__item:hover {
  background: rgba(78, 205, 196, 0.08);
}

.item-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.item-desc {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-arrow {
  color: var(--accent-cyan);
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ===== 生成动画提示 ===== */
.generating-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 200;
  pointer-events: none;
}

.generating-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 48px;
  background: rgba(26, 31, 54, 0.9);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  border: 1px solid rgba(78, 205, 196, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.generating-spinner {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinner-ring {
  position: absolute;
  inset: 0;
  border: 3px solid transparent;
  border-top-color: #4ecdc4;
  border-radius: 50%;
  animation: spin-ring 1.2s linear infinite;
}

.spinner-ring:nth-child(2) {
  inset: 6px;
  border-top-color: #a78bfa;
  animation-delay: -0.4s;
  animation-direction: reverse;
}

.spinner-ring:nth-child(3) {
  inset: 12px;
  border-top-color: #60a5fa;
  animation-delay: -0.8s;
}

@keyframes spin-ring {
  to {
    transform: rotate(360deg);
  }
}

.generating-text {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.generating-progress {
  font-size: 28px;
  font-weight: 700;
  color: #4ecdc4;
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.generating-fade-enter-active,
.generating-fade-leave-active {
  transition: all 0.3s ease;
}

.generating-fade-enter-from,
.generating-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
}

/* ===== 图库面板 ===== */
.gallery-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.gallery-bar:hover {
  border-color: var(--accent-cyan);
  background: rgba(78, 205, 196, 0.04);
}

.gallery-bar__left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.gallery-bar__badge {
  background: linear-gradient(135deg, #4ecdc4, #a78bfa);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 10px;
}

.gallery-bar__thumbs {
  display: flex;
  gap: -6px;
}

.gallery-bar__thumb {
  width: 28px;
  height: 28px;
  border-radius: 5px;
  object-fit: cover;
  border: 2px solid var(--bg-card);
  margin-left: -6px;
}

.gallery-bar__thumb:first-child {
  margin-left: 0;
}

.gallery-bar__arrow {
  color: var(--text-muted);
  margin-left: auto;
}

/* 面板 */
.gallery-panel {
  display: flex;
  flex-direction: column;
  max-height: 320px;
  overflow: hidden;
}

.gallery-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px 10px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.gallery-panel__title-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.gallery-panel__title-row h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.gallery-panel__sub {
  font-size: 11px;
  color: var(--text-muted);
}

.gallery-panel__body {
  display: flex;
  gap: 16px;
  padding: 14px 18px;
  overflow: hidden;
  flex: 1;
}

.gallery-panel__left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 160px;
  flex-shrink: 0;
}

.gallery-detail-img {
  width: 160px;
  height: 110px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--border-light);
}

.gallery-detail-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gallery-detail-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.gallery-detail-date {
  font-size: 11px;
  color: var(--text-muted);
}

.gallery-thumb-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
}

.gallery-thumb-item {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 5px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.gallery-thumb-item:hover {
  border-color: var(--accent-cyan);
  transform: scale(1.05);
}

.gallery-thumb-item.active {
  border-color: var(--accent-cyan);
}

.gallery-panel__right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
  min-width: 0;
}

.stats-grid {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.stat-card {
  flex: 1;
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.stat-label {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: "JetBrains Mono", monospace;
}

.stat-value.accent {
  color: var(--accent-cyan);
}

.stat-value.green {
  color: #059669;
}

.stat-value.red {
  color: #dc2626;
}

.chart-container {
  flex: 1;
  min-height: 120px;
  width: 100%;
}

/* 图库滑入 */
.gallery-slide-enter-active,
.gallery-slide-leave-active {
  transition: all 0.3s ease;
}

.gallery-slide-enter-from,
.gallery-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
