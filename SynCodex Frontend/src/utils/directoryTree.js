function normalizePath(path) {
  return path.replace(/\\/g, "/");
}

function sortTreeEntries(entries) {
  return entries.sort((left, right) => {
    if (left.type === right.type) {
      return left.name.localeCompare(right.name);
    }

    return left.type === "folder" ? -1 : 1;
  });
}

async function ensureReadPermission(handle) {
  if (!handle?.queryPermission || !handle?.requestPermission) {
    return;
  }

  const query = await handle.queryPermission({ mode: "read" });
  if (query === "granted") {
    return;
  }

  const request = await handle.requestPermission({ mode: "read" });
  if (request !== "granted") {
    throw new Error("Permission denied to read selected folder.");
  }
}

async function walkDirectoryHandle(directoryHandle, basePath = "") {
  const currentPath = basePath
    ? normalizePath(`${basePath}/${directoryHandle.name}`)
    : normalizePath(`/${directoryHandle.name}`);

  const node = {
    id: currentPath,
    type: "folder",
    name: directoryHandle.name,
    path: currentPath,
    children: [],
  };

  for await (const [entryName, entryHandle] of directoryHandle.entries()) {
    const entryPath = normalizePath(`${currentPath}/${entryName}`);

    if (entryHandle.kind === "directory") {
      const childDirectoryNode = await walkDirectoryHandle(
        entryHandle,
        currentPath
      );
      node.children.push(childDirectoryNode);
      continue;
    }

    node.children.push({
      id: entryPath,
      type: "file",
      name: entryName,
      path: entryPath,
    });
  }

  node.children = sortTreeEntries(node.children);
  return node;
}

export async function directoryHandleToJsonTree(directoryHandle) {
  if (!directoryHandle || directoryHandle.kind !== "directory") {
    throw new Error("Invalid directory handle.");
  }

  await ensureReadPermission(directoryHandle);
  return walkDirectoryHandle(directoryHandle);
}
