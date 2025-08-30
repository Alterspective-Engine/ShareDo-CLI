interface SharedoWFActionManifest {
  systemName: string;
  category: string;
  name: string;
  icon: string;
  description: string;
  configWidget: string;
  factoryIncludes: string[];
  factoryScript: string;
  templateScript: string;
  helperScripts: string[];
  requiredTypes: string[];
}