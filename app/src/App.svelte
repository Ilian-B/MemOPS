<script>
  import { AVERTISSEMENT } from './lib/avertissement.js'
</script>

<main>
  <h1>Révision pompiers</h1>
  <p class="avertissement" role="note">{AVERTISSEMENT}</p>
</main>

<style>
  main {
    max-width: 480px;
    margin: 0 auto;
    padding: 2rem 1rem;
    text-align: center;
  }
  h1 {
    color: #d62828;
    font-size: 2rem;
    margin: 0 0 1.5rem;
  }
  .avertissement {
    background: #ffe8b0;
    border-left: 6px solid #f77f00;
    border-radius: 8px;
    padding: 1rem;
    text-align: left;
    line-height: 1.4;
  }
</style>
