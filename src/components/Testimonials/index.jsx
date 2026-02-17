import React from 'react';
import styles from './Testimonials.module.css';

const testimonials = [
  {
    name: "Mark Erikson",
    username: "acemarke",
    avatar: "https://unavatar.io/x/acemarke",
    content: "We've been using Docusaurus for all the Redux org docs sites for the last couple years, and it's great! We've been able to focus on content, customize some presentation and features, and It Just Works.",
    date: "Oct 26, 2021",
    url: "https://x.com/acemarke/status/1452725153998245891"
  },
  {
    name: "Supabase",
    username: "supabase",
    avatar: "https://unavatar.io/x/supabase",
    content: "We've been using V2 since January and it has been great - we spend less time building documentation and more time building 🛳",
    date: "Nov 18, 2020",
    url: "https://x.com/supabase/status/1328960757149671425"
  },
  {
    name: "Dr.Electron",
    username: "Dr_Electron",
    avatar: "https://unavatar.io/x/Dr_Electron",
    content: "The #IOTA wiki is now part of the @docusaurus showcase. We even have the honor of being a favorite. We are really happy that we found this project. It helped us a lot to improve the documentation.",
    date: "Oct 11, 2021",
    url: "https://x.com/Dr_Electron/status/1443635328376508433"
  },
  {
    name: "Maël",
    username: "arcanis",
    avatar: "https://unavatar.io/x/arcanis",
    content: "I've used Docusaurus for two websites this year, and I've been very happy about the v2. Looks good, and simple to setup.",
    date: "Jan 20, 2021",
    url: "https://x.com/arcanis/status/1351620354561732608"
  },
  {
    name: "Paul Armstrong",
    username: "paularmstrong",
    avatar: "https://unavatar.io/x/paularmstrong",
    content: "Continue to be impressed and excited about Docusaurus v2 alpha releases. Already using the sidebar items generator to help monorepo workspace devs create their own doc pages without any configuration needed.",
    date: "Apr 27, 2021",
    url: "https://x.com/paularmstrong/status/1387059593373700100"
  },
  {
    name: "Kent C. Dodds",
    username: "kentcdodds",
    avatar: "https://unavatar.io/x/kentcdodds",
    content: "https://testing-library.com just got a nice update! We're now on the latest version of @docusaurus thanks to @matanbobi, @TensorNo, and @nickemccurdy 💙 My favorite new feature: dark mode!! 🌑/☀️",
    date: "Nov 4, 2020",
    url: "https://x.com/kentcdodds/status/1323806816019468288"
  },
  {
    name: "Max Lynch",
    username: "maxlynch",
    avatar: "https://unavatar.io/x/maxlynch",
    content: "Docusaurus v2 doubles as a really nice little static site generator tool for content-focused sites, love it 👏",
    date: "Mar 25, 2021",
    url: "https://x.com/maxlynch/status/1375113166007455748"
  },
  {
    name: "Debbie O'Brien",
    username: "debs_obrien",
    avatar: "https://unavatar.io/x/debs_obrien",
    content: "Been doing a lot of work with @docusaurus lately and I have to say it is really fun to work with. A lot of really cool features. I love that you can easily reuse content by creating a markdown file and importing it as a component. 🔥",
    date: "Mar 24, 2021",
    url: "https://x.com/debs_obrien/status/1374615572298801155"
  },
  {
    name: "swyx",
    username: "swyx",
    avatar: "https://unavatar.io/x/swyx",
    content: "Happy to share Temporal's first open source sponsorship — of @docusaurus! @temporalio uses it for https://docs.temporal.io, and it has been a huge boon to our docs team. @sebastienlorber is an incredible steward of the project, support it if you can!",
    date: "Jul 23, 2021",
    url: "https://x.com/swyx/status/1418405515684581378"
  }
];

export default function Testimonials() {
  return (
    <section className={styles.testimonialsSection}>
      <div className={styles.container}>
        <h2 className={styles.title}>Loved by many engineers</h2>
        
        <div className={styles.grid}>
          {testimonials.map((testimonial, index) => (
            <a 
              key={index}
              href={testimonial.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.tweetCard}
            >
              <div className={styles.tweetHeader}>
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.name}
                  className={styles.avatar}
                />
                <div className={styles.userInfo}>
                  <div className={styles.name}>{testimonial.name}</div>
                  <div className={styles.username}>@{testimonial.username}</div>
                </div>
              </div>
              
              <div className={styles.tweetContent}>
                {testimonial.content}
              </div>
              
              <div className={styles.tweetDate}>
                {testimonial.date}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
