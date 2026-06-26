<script lang="ts">
	import './layout.css';
	import './style.css';
	import './chat.css';
	import './estimation.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0/tabler-icons.min.css">
</svelte:head>

{@render children()}
