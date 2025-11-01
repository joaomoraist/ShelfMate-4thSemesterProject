import React from "react";
import styles from "../styles/footer.module.css";

const SiteFooter: React.FC = () => {
  return (
    <footer className={styles.siteFooter}>
      <div className={styles.footerInner}>
        <div className={styles.footerSection}>
          <div className={styles.footerTitle}>Shelf Mate</div>
          <div className={styles.footerDescription}>
            Gerencie seu estoque, acompanhe métricas e tome decisões baseadas em dados.
          </div>
        </div>

        <div className={styles.footerSection}>
          <div className={styles.footerTitle}>Recursos</div>
          <div className={styles.footerLinks}>
            Dashboard • Produtos • Configurações
          </div>
        </div>

        <div className={styles.footerSection}>
          <div className={styles.footerTitle}>Código Fonte</div>
          <div className={styles.footerDescription}>
            <a
              href="https://github.com/will-csc/ShelfMate-4thSemesterProject"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              Acesse nosso Github e Conheça toda nossa infraestrutura
            </a>
          </div>
          <div className={styles.githubLink}>
            <a
              href="https://github.com/will-csc/ShelfMate-4thSemesterProject"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              https://github.com/will-csc/ShelfMate-4thSemesterProject
            </a>
          </div>
        </div>

        <div className={styles.footerSection}>
          <div className={styles.footerTitle}>Suporte</div>
          <div className={styles.contactInfo}>william.carvalho.105637@a.fecaf.com.br</div>
          <div className={styles.contactInfo}>+55 11 98432-5997</div>
        </div>

        <div className={styles.footerSection}>
          <div className={styles.footerTitle}>Desenvolvedores</div>
          <div className={styles.developerList}>
            <div>william.carvalho.105637@a.fecaf.com.br</div>
            <div>eduardo.silva.100462@a.fecaf.com.br</div>
            <div>joao.timotio.103916@a.fecaf.com.br</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;