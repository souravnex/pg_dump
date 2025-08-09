export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function generateDumpFilename(
  serverId: string,
  containerName: string,
  dbName: string,
  options?: { data_only?: boolean; schema_only?: boolean }
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  let suffix = '';
  
  if (options?.data_only) suffix = '_data-only';
  else if (options?.schema_only) suffix = '_schema-only';
  
  return `${serverId}_${containerName}_${dbName}${suffix}_${timestamp}.sql`;
}
