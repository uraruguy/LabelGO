declare module '*.css';

// React Native's FormData polyfill accepts a { uri, name, type } object in
// place of a Blob/File value, which the DOM lib's FormData type doesn't know
// about. This augments the global FormData with that native-only overload.
interface FormData {
  append(name: string, value: { uri: string; name: string; type: string }): void;
}
